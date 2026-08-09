<template>
  <div v-if="isSupported" class="voice-input-bar">
    <!-- 收起状态：仅显示麦克风图标按钮 -->
    <button v-if="!panelVisible && !isListening && !isPaused && !finalText" class="voice-toggle-btn"
      :disabled="disabled" :title="isListening ? '正在聆听...' : '语音录入'" @click="openPanel">
      <MyIcon name="voice" :size="20" />
    </button>

    <!-- 展开面板 -->
    <div v-if="panelVisible || isListening || isPaused || finalText" class="voice-panel">
      <!-- 头部：状态 + 操作按钮 -->
      <div class="voice-panel-header">
        <div class="flex items-center gap-2">
          <!-- 麦克风按钮 -->
          <button class="mic-btn" :class="{
            'mic-listening': isListening,
            'mic-paused': isPaused,
            'mic-error': !!error,
          }" :disabled="disabled" @click="handleMicClick">
            <MyIcon name="voice" :size="18" />
          </button>
          <span class="status-text text-sm">
            <template v-if="error">
              <span class="text-red-500">{{ error }}</span>
            </template>
            <template v-else-if="isListening">
              <span class="listening-dot"></span>
              正在聆听...
            </template>
            <template v-else-if="isPaused">
              已暂停
            </template>
            <template v-else>
              点击开始录音
            </template>
          </span>
        </div>
        <div class="flex items-center gap-1">
          <template v-if="isListening">
            <button class="action-btn pause-btn" title="暂停" @click="pause">
              <MyIcon name="pause" :size="16" />
            </button>
            <button class="action-btn stop-btn" title="停止" @click="handleStop">
              <MyIcon name="power" :size="16" />
            </button>
          </template>
          <template v-else-if="isPaused">
            <button class="action-btn resume-btn" title="继续" @click="resume">
              <MyIcon name="play" :size="16" />
            </button>
            <button class="action-btn stop-btn" title="停止" @click="handleStop">
              <MyIcon name="power" :size="16" />
            </button>
          </template>
          <!-- 收起按钮 -->
          <button v-if="!isListening && !isPaused" class="action-btn close-btn" title="收起"
            @click="panelVisible = false">
            <MyIcon name="close" :size="16" />
          </button>
        </div>
      </div>

      <!-- 内容区：临时识别 + 已确认文本 -->
      <div v-if="interimText || finalText" class="voice-panel-body">
        <!-- 临时识别内容 -->
        <div v-if="interimText" class="interim-text">
          {{ interimText }}
        </div>
        <div v-if="interimText && finalText" class="divider"></div>
        <!-- 已确认内容 -->
        <div v-if="finalText" class="final-text">
          {{ finalText }}
        </div>
      </div>

      <!-- 底部操作 -->
      <div v-if="finalText" class="voice-panel-footer">
        <button class="insert-btn" @click="handleInsert">
          <MyIcon name="check" :size="14" class="mr-1" />
          插入到编辑器
        </button>
        <button class="clear-btn" @click="clear">
          <MyIcon name="delete" :size="14" class="mr-1" />
          清空
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

withDefaults(
  defineProps<{
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  }
);

const emit = defineEmits<{
  (e: 'insert', text: string): void;
}>();

const {
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
} = useSpeechRecognition({
  lang: 'zh-CN',
  continuous: true,
  interimResults: true,
});

const panelVisible = ref(false);

const openPanel = () => {
  panelVisible.value = true;
};

const handleMicClick = () => {
  if (error.value) {
    // 出错后重试
    clear();
    start();
  } else if (isListening.value) {
    pause();
  } else if (isPaused.value) {
    resume();
  } else {
    start();
  }
};

const handleStop = () => {
  stop();
};

const handleInsert = () => {
  const text = stop();
  if (text.trim()) {
    emit('insert', text);
    clear();
    panelVisible.value = false;
  }
};

onBeforeUnmount(() => {
  cleanup();
});
</script>

<style lang="scss" scoped>
.voice-input-bar {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 50;
}

.voice-toggle-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--sys-border-color);
  background-color: var(--sys-box-bg-color);
  color: var(--sys-text-secondary-color);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    color: var(--theme-color);
    border-color: var(--theme-color);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.voice-panel {
  width: 340px;
  max-height: 320px;
  background-color: var(--sys-box-bg-color);
  border: 1px solid var(--sys-border-color);
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.voice-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--sys-border-color);
}

.mic-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background-color: transparent;
  color: var(--sys-text-secondary-color);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--sys-deep-wrapper-bg-color);
  }

  &.mic-listening {
    color: #fff;
    background-color: #ef4444;
    animation: mic-pulse 1.5s ease-in-out infinite;

    &:hover {
      background-color: #dc2626;
    }
  }

  &.mic-paused {
    color: #f59e0b;
    background-color: rgba(245, 158, 11, 0.1);
  }

  &.mic-error {
    color: #ef4444;
    background-color: rgba(239, 68, 68, 0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

@keyframes mic-pulse {

  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }

  50% {
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0);
  }
}

.status-text {
  color: var(--sys-text-secondary-color);
}

.listening-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #ef4444;
  margin-right: 4px;
  vertical-align: middle;
  animation: dot-blink 1s ease-in-out infinite;
}

@keyframes dot-blink {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.3;
  }
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background-color: transparent;
  color: var(--sys-text-secondary-color);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background-color: var(--sys-deep-wrapper-bg-color);
  }

  &.stop-btn:hover {
    color: #ef4444;
    background-color: rgba(239, 68, 68, 0.1);
  }

  &.resume-btn:hover {
    color: var(--theme-color);
  }
}

.voice-panel-body {
  padding: 10px 12px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  max-height: 160px;
}

.interim-text {
  font-style: italic;
  color: var(--sys-text-secondary-color);
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
}

.final-text {
  color: var(--sys-text-color);
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-wrap;
}

.divider {
  height: 1px;
  background-color: var(--sys-border-color);
  margin: 8px 0;
}

.voice-panel-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid var(--sys-border-color);
}

.insert-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 6px 12px;
  border-radius: 6px;
  border: none;
  background-color: var(--theme-color);
  color: #fff;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: var(--theme-hover);
  }
}

.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid var(--sys-border-color);
  background-color: transparent;
  color: var(--sys-text-secondary-color);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: #ef4444;
    border-color: #ef4444;
  }
}
</style>
