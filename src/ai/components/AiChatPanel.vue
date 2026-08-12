<template>
  <div class="ai-chat-panel">
    <!-- 顶部标题栏 -->
    <div class="panel-header">
      <div class="header-left">
        <AppIcon name="robot" :size="18" color="var(--theme-color)" />
        <span class="header-title">{{ activeConversation?.title || 'AI 助手' }}</span>
      </div>
      <div class="header-actions">
        <el-tooltip content="新建对话" placement="bottom">
          <button class="action-btn" @click="handleNewConversation">
            <AppIcon name="add" :size="16" />
          </button>
        </el-tooltip>
        <el-tooltip content="清空当前对话" placement="bottom">
          <button class="action-btn" @click="handleClearConversation">
            <AppIcon name="delete" :size="16" />
          </button>
        </el-tooltip>
      </div>
    </div>

    <!-- 消息列表 -->
    <div ref="messageListRef" class="message-list">
      <div v-if="messages.length === 0" class="empty-state">
        <div class="empty-icon">
          <AppIcon name="robot" :size="48" color="var(--sys-text-secondary-color)" />
        </div>
        <p class="empty-title">你好，我是 AI 助手</p>
        <p class="empty-desc">我可以帮助你管理博客、回答问题、提供写作建议。请输入你的问题开始对话吧。</p>
      </div>

      <div v-for="msg in messages" :key="msg.id" class="message-item" :class="`msg-${msg.role}`">
        <!-- 用户消息 -->
        <div v-if="msg.role === 'user'" class="user-message">
          <div class="msg-bubble user-bubble">
            {{ msg.content }}
          </div>
        </div>

        <!-- 助手消息 -->
        <div v-else-if="msg.role === 'assistant'" class="assistant-message">
          <div class="msg-bubble assistant-bubble">
            <!-- 空内容且流式输出中 -->
            <div v-if="!msg.content && msg.isStreaming" class="typing-indicator">
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
            </div>
            <!-- Markdown 渲染 -->
            <div v-else class="markdown-body-wrapper">
              <v-md-preview :text="msg.content" />
            </div>
            <!-- 流式输出光标 -->
            <span v-if="msg.isStreaming && msg.content" class="streaming-cursor">|</span>
          </div>
          <!-- 操作按钮 -->
          <div v-if="!msg.isStreaming && msg.content" class="msg-actions">
            <button class="msg-action-btn" @click="copyMessageContent(msg.content)">
              <AppIcon name="copy" :size="14" />
            </button>
            <button v-if="isLastAssistantMessage(msg)" class="msg-action-btn" @click="regenerate">
              <AppIcon name="refresh" :size="14" />
            </button>
          </div>
        </div>
      </div>

      <!-- 错误提示 -->
      <div v-if="error" class="error-bar">
        <span class="error-text">{{ error }}</span>
        <el-button size="small" type="primary" @click="retry">重试</el-button>
        <el-button size="small" @click="error = null">关闭</el-button>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <el-input v-model="inputText" type="textarea" :rows="2" placeholder="输入消息，Enter 发送，Shift+Enter 换行"
        :disabled="isSending" resize="none" @keydown.enter.exact.prevent="handleSend" />
      <div class="input-actions">
        <span class="input-hint">Shift+Enter 换行</span>
        <el-button v-if="isSending" type="danger" size="small" @click="cancel">
          <template #icon>
            <AppIcon name="pause" :size="14" color="#fff" />
          </template>
          停止生成
        </el-button>
        <el-button v-else type="primary" size="small" :disabled="!inputText.trim()" @click="handleSend">
          <template #icon>
            <AppIcon name="send" :size="14" color="#fff" />
          </template>
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useAiChat } from '@/ai/composables/useAiChat'
import type { AiMessage } from '@/ai/types/ai'

const {
  messages,
  activeConversation,
  isSending,
  inputText,
  error,
  messageListRef,
  send,
  cancel,
  retry,
  regenerate,
  scrollToBottom,
  newConversation,
  deleteConversation,
  cleanup,
} = useAiChat()

// ==================== 消息滚动 ====================

// 监听消息变化自动滚动到底部
watch(
  () => [messages.value.length, messages.value[messages.value.length - 1]?.content],
  () => {
    scrollToBottom()
  },
  { deep: false }
)

// ==================== 事件处理 ====================

function handleSend() {
  if (!inputText.value.trim() || isSending.value) return
  send()
}

function handleNewConversation() {
  newConversation()
  error.value = null
}

function handleClearConversation() {
  if (activeConversation.value) {
    deleteConversation(activeConversation.value.id)
    error.value = null
  }
}

function isLastAssistantMessage(msg: AiMessage): boolean {
  const msgs = messages.value
  if (msgs.length === 0) return false
  const lastAssistant = [...msgs].reverse().find((m) => m.role === 'assistant')
  return lastAssistant?.id === msg.id
}

function copyMessageContent(content: string) {
  copyClick(content)
}

// ==================== 生命周期 ====================

onBeforeUnmount(() => {
  cleanup()
})
</script>

<style lang="scss" scoped>
.ai-chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--sys-bg-color);
}

// ==================== 顶部标题栏 ====================

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--sys-border-color);
  flex-shrink: 0;

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .header-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--sys-text-color);
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: var(--sys-text-secondary-color);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: var(--sys-wrapper-bg-color);
      color: var(--sys-text-color);
    }
  }
}

// ==================== 消息列表 ====================

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  min-height: 0;

  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--sys-border-color);
    border-radius: 2px;
  }
}

// ==================== 空状态 ====================

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 2rem;

  .empty-icon {
    margin-bottom: 1rem;
    opacity: 0.4;
  }

  .empty-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--sys-text-color);
    margin-bottom: 0.5rem;
  }

  .empty-desc {
    font-size: 13px;
    color: var(--sys-text-secondary-color);
    line-height: 1.6;
    max-width: 280px;
  }
}

// ==================== 消息项 ====================

.message-item {
  margin-bottom: 1rem;
}

// ==================== 用户消息 ====================

.user-message {
  display: flex;
  justify-content: flex-end;

  .user-bubble {
    background: var(--theme-color);
    color: #fff;
    border-radius: 12px 12px 4px 12px;
    max-width: 80%;
    padding: 0.6rem 0.85rem;
    font-size: 14px;
    line-height: 1.6;
    word-break: break-word;
    white-space: pre-wrap;
  }
}

// ==================== 助手消息 ====================

.assistant-message {
  .assistant-bubble {
    background: var(--sys-box-bg-color);
    color: var(--sys-text-color);
    border-radius: 12px 12px 12px 4px;
    max-width: 100%;
    padding: 0.6rem 0.85rem;
    font-size: 14px;
    line-height: 1.6;
    word-break: break-word;
    display: inline-block;
  }

  .msg-actions {
    display: flex;
    gap: 0.25rem;
    margin-top: 0.25rem;
    margin-left: 0.25rem;
  }

  .msg-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: var(--sys-text-secondary-color);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: var(--sys-wrapper-bg-color);
      color: var(--sys-text-color);
    }
  }
}

// ==================== Markdown 内容 ====================

.markdown-body-wrapper {
  // 控制 v-md-preview 的消息内样式
  :deep(.vuepress-markdown-body) {
    padding: 0;
    background: transparent;
    font-size: 14px;
    line-height: 1.6;

    // 减小代码块字体
    pre {
      font-size: 12px;
      padding: 0.5rem 0.75rem;
      margin: 0.5rem 0;
    }

    code {
      font-size: 12px;
    }

    // 减小标题间距
    h1, h2, h3, h4, h5, h6 {
      margin: 0.5rem 0 0.25rem;
    }

    // 减小段落间距
    p {
      margin: 0.25rem 0;
    }

    // 列表样式
    ul, ol {
      padding-left: 1.25rem;
      margin: 0.25rem 0;
    }

    // 表格
    table {
      font-size: 12px;
      margin: 0.5rem 0;
    }

    // 引用块
    blockquote {
      margin: 0.5rem 0;
      padding: 0.25rem 0.75rem;
    }
  }
}

// ==================== 打字指示器 ====================

.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 4px 0;

  .typing-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--sys-text-secondary-color);
    animation: typing-bounce 1.4s infinite ease-in-out both;

    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes typing-bounce {
  0%, 80%, 100% {
    transform: scale(0.4);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

// ==================== 流式光标 ====================

.streaming-cursor {
  display: inline-block;
  animation: cursor-blink 0.8s infinite;
  color: var(--theme-color);
  font-weight: bold;
  margin-left: 1px;
}

@keyframes cursor-blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

// ==================== 错误栏 ====================

.error-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #fef0f0;
  border: 1px solid #fde2e2;
  border-radius: 8px;
  margin-top: 0.5rem;

  .error-text {
    flex: 1;
    font-size: 12px;
    color: #f56c6c;
  }
}

// ==================== 输入区域 ====================

.input-area {
  flex-shrink: 0;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--sys-border-color);
  background: var(--sys-bg-color);

  :deep(.el-textarea__inner) {
    background: var(--sys-wrapper-bg-color);
    border-color: var(--sys-border-color);
    color: var(--sys-text-color);
    font-size: 14px;
    line-height: 1.6;
    resize: none;

    &::placeholder {
      color: var(--sys-text-secondary-color);
    }

    &:focus {
      border-color: var(--theme-color);
    }

    &:disabled {
      background: var(--sys-wrapper-bg-color);
      opacity: 0.6;
    }
  }

  .input-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 0.5rem;
  }

  .input-hint {
    font-size: 11px;
    color: var(--sys-text-secondary-color);
  }
}
</style>
