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

/*
 * 中文标点恢复 —— 基于规则的标点符号插入
 * 已停用：中文断句需要语义理解，纯规则法误插标点频繁，有它不如没有。
 * 如需更好的断句效果，可换用自带标点的云端 ASR（讯飞/阿里/腾讯等），或在后端
 * 接入标点恢复模型（如 PaddleNLP 标点模型 / ct-punctuation）或 LLM 加标点。
 *
function restoreChinesePunctuation(text: string): string {
  if (!text) return '';

  let result = text;

  // 1. 在常见连词/转折词前插入逗号
  const conjunctions = [
    '但是', '但', '然而', '不过', '可是',
    '所以', '因此', '因而', '于是',
    '而且', '并且', '况且', '此外', '另外',
    '然后', '接着', '接下来', '随后',
    '还有', '同时', '以及',
    '否则', '不然', '要不然',
    '总之', '总的来说', '综上所述',
    '其实',
    '当然',
    '比如', '例如', '比方说',
    '特别是', '尤其是',
    '换句话说', '也就是说',
    '相比之下', '相反',
    '一方面', '另一方面',
    '首先', '其次', '最后', '第一', '第二', '第三',
    '因为', '由于',
  ];

  // 按长度降序排列，优先匹配更长的词
  const sortedConjunctions = [...conjunctions].sort((a, b) => b.length - a.length);

  for (const conj of sortedConjunctions) {
    // 匹配：前面不是标点符号，后面不是标点符号
    const escaped = conj.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(
      `([^，。！？、；：\\n])(${escaped})([^，。！？、；：])`,
      'g'
    );
    result = result.replace(regex, `$1，$2$3`);
  }

  // 2. 在句末疑问词后插入问号
  result = result.replace(/([吗])(\s|$)/g, '$1？$2');
  result = result.replace(/([呢])(\s|$)/g, (match, p1, p2, offset) => {
    // 仅在接近句末（后 10 个字符内无其他标点）时转问号
    const rest = result.substring(offset + 1);
    if (rest.length < 10 && !/[，。！？]/.test(rest)) {
      return `${p1}？${p2}`;
    }
    return match;
  });

  // 3. 在感叹词后插入感叹号
  result = result.replace(/([啊呀啦哇哎哟])(\s|$)/g, (match, p1, p2, offset) => {
    const rest = result.substring(offset + 1);
    if (rest.length < 8 && !/[，。！？]/.test(rest)) {
      return `${p1}！${p2}`;
    }
    return match;
  });

  // 4. 对超过 25 个字符的无标点段落，尝试在自然位置插入逗号
  const processSegment = (segment: string): string => {
    if (segment.length <= 25) return segment;

    // 在"的"字后面插入逗号的模式：名词短语后的"的"+空格感
    // 在"了"后面且后面是独立短句时插入逗号
    let processed = segment;

    processed = processed.replace(
      /([^，。！？、；：\n]{3,}了)([^，。！？、；：\n]{3,})/g,
      '$1，$2'
    );

    // 如果处理后仍超过 25 个字符且无标点，在中点附近插入逗号
    if (processed.length > 25 && !/[，。！？、；：]/.test(processed)) {
      const mid = Math.floor(processed.length / 2);
      // 找到中点附近的词边界
      let insertPos = mid;
      for (let i = mid; i < processed.length && i < mid + 5; i++) {
        if (/[了]/.test(processed[i])) {
          insertPos = i + 1;
          break;
        }
      }
      processed = processed.substring(0, insertPos) + '，' + processed.substring(insertPos);
    }

    return processed;
  };

  // 按现有标点分段处理
  const segments = result.split(/([，。！？、；：\n])/);
  const processed: string[] = [];
  for (let i = 0; i < segments.length; i += 2) {
    processed.push(processSegment(segments[i]));
    if (i + 1 < segments.length) {
      processed.push(segments[i + 1]);
    }
  }
  result = processed.join('');

  // 5. 确保文本以标点结尾
  const lastChar = result.trimEnd().slice(-1);
  if (lastChar && !/[，。！？、；：\n]/.test(lastChar)) {
    result = result.trimEnd() + '。';
  }

  // 6. 清理多余空白和连续的逗号
  result = result.replace(/，+/g, '，');
  result = result.replace(/。+/g, '。');
  result = result.replace(/[ \t]{2,}/g, ' ');
  result = result.replace(/，(\s*[，。！？、；：])/g, '$1');
  result = result.replace(/[，。！？、；：]+$/g, (match) => match.slice(-1));

  return result.trim();
}
 */

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
  const rawFinalText = ref('');
  // 中文标点恢复（规则法）效果不佳，暂不启用，直接返回原始识别文本
  const finalText = computed(() => rawFinalText.value);
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
          rawFinalText.value += result[0].transcript;
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

    // 注意：recognition.stop() 会触发一次 onresult 事件，把临时识别内容作为最终结果追加到
    // rawFinalText，因此这里不能再手动合并 interimText，否则会重复生成
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

    // 注意：recognition.stop() 会触发一次 onresult 事件，把临时识别内容作为最终结果追加到
    // rawFinalText，因此这里不能再手动合并 interimText，否则会重复生成
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
    rawFinalText.value = '';
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
