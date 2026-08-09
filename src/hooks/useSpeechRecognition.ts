import { ElMessage } from 'element-plus';

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

export interface SpeechOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

export function useSpeechRecognition(options: SpeechOptions = {}) {
  const {
    lang = 'zh-CN',
    continuous = true,
    interimResults = true,
    maxAlternatives = 1,
  } = options;

  const SpeechRecognitionCtor =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  const isSupported = ref(!!SpeechRecognitionCtor);
  const isListening = ref(false);
  const isPaused = ref(false);
  const interimText = ref('');
  const finalText = ref('');
  const error = ref<string | null>(null);

  let recognition: SpeechRecognitionInstance | null = null;
  let silenceTimeout: ReturnType<typeof setTimeout> | null = null;
  let wasStoppedByUser = false;

  const clearSilenceTimeout = () => {
    if (silenceTimeout) {
      clearTimeout(silenceTimeout);
      silenceTimeout = null;
    }
  };

  const createRecognition = (): SpeechRecognitionInstance | null => {
    if (!SpeechRecognitionCtor) return null;

    const rec = new SpeechRecognitionCtor() as SpeechRecognitionInstance;
    rec.lang = lang;
    rec.continuous = continuous;
    rec.interimResults = interimResults;
    rec.maxAlternatives = maxAlternatives;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      clearSilenceTimeout();
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText.value += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      interimText.value = interim;

      // Chrome 连续模式下，不说话约 60s 会自动停止，这里重置静默计时
      silenceTimeout = setTimeout(() => {
        if (isListening.value) {
          pause();
        }
      }, 55000);
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      clearSilenceTimeout();
      const errorType = event.error;

      switch (errorType) {
        case 'not-allowed':
          error.value = '麦克风权限被拒绝，请在浏览器设置中开启';
          ElMessage.warning('麦克风权限被拒绝，请在浏览器设置中开启');
          stop();
          break;
        case 'network':
          error.value = '网络连接异常，语音识别需要网络支持';
          ElMessage.error('网络连接异常，语音识别需要网络支持');
          stop();
          break;
        case 'no-speech':
          // 未检测到语音，不视为错误，仅静默处理
          error.value = null;
          break;
        case 'aborted':
          // 主动停止，不视为错误
          if (!wasStoppedByUser) {
            error.value = null;
          }
          break;
        default:
          error.value = `语音识别错误: ${errorType}`;
          break;
      }
    };

    rec.onend = () => {
      clearSilenceTimeout();
      // 如果不是用户主动停止的，尝试自动恢复
      if (!wasStoppedByUser && isListening.value && !isPaused.value) {
        try {
          rec.start();
          return;
        } catch {
          // 自动恢复失败，切换到暂停状态
          isListening.value = false;
          isPaused.value = true;
        }
      }
      isListening.value = false;
    };

    return rec;
  };

  const start = () => {
    if (!isSupported.value) {
      error.value = '您的浏览器不支持语音识别，请使用 Chrome、Edge 或 Safari';
      return;
    }

    error.value = null;
    wasStoppedByUser = false;

    recognition = createRecognition();
    if (!recognition) return;

    try {
      recognition.start();
      isListening.value = true;
      isPaused.value = false;
    } catch (err: any) {
      error.value = `启动语音识别失败: ${err.message || err}`;
      isListening.value = false;
    }
  };

  const stop = (): string => {
    wasStoppedByUser = true;
    clearSilenceTimeout();

    if (recognition) {
      try {
        recognition.stop();
      } catch {
        // 可能已经停止了，忽略错误
      }
      recognition = null;
    }

    isListening.value = false;
    isPaused.value = false;

    // 如果有临时结果，合并到最终结果
    if (interimText.value) {
      finalText.value += interimText.value;
      interimText.value = '';
    }

    return finalText.value;
  };

  const pause = () => {
    wasStoppedByUser = true;
    clearSilenceTimeout();

    if (recognition) {
      try {
        recognition.stop();
      } catch {
        // 可能已经停止了，忽略错误
      }
    }

    // 临时结果合并到最终结果
    if (interimText.value) {
      finalText.value += interimText.value;
      interimText.value = '';
    }

    isListening.value = false;
    isPaused.value = true;
  };

  const resume = () => {
    if (!isSupported.value || !isPaused.value) return;

    error.value = null;
    wasStoppedByUser = false;

    recognition = createRecognition();
    if (!recognition) return;

    try {
      recognition.start();
      isListening.value = true;
      isPaused.value = false;
    } catch (err: any) {
      error.value = `恢复语音识别失败: ${err.message || err}`;
      isPaused.value = true;
    }
  };

  const clear = () => {
    finalText.value = '';
    interimText.value = '';
    error.value = null;
  };

  // 组件卸载时清理
  const cleanup = () => {
    clearSilenceTimeout();
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
      recognition = null;
    }
    isListening.value = false;
    isPaused.value = false;
  };

  return {
    isSupported,
    isListening,
    isPaused,
    interimText,
    finalText,
    error,
    start,
    stop,
    pause,
    resume,
    clear,
    cleanup,
  };
}
