import { useAiChatStore } from '@/ai/store/aiChat'
import { sendChatMessage } from '@/ai/services/aiApi'
import { useUserInfoStore } from '@/store/user'

/**
 * AI 聊天核心逻辑
 *
 * 使用方式：
 * ```ts
 * const { send, messages, isLoading } = useAiChat()
 * ```
 */
export function useAiChat() {
  // ==================== Store ====================
  const store = useAiChatStore()
  const userStore = useUserInfoStore()

  // ==================== 状态 ====================

  /** 输入框文本 */
  const inputText = ref('')

  /** 错误信息 */
  const error = ref<string | null>(null)

  /** 当前请求的 AbortController */
  let currentController: AbortController | null = null

  /** 消息列表容器引用 */
  const messageListRef = ref<HTMLElement | null>(null)

  // ==================== 上下文构建 ====================

  /**
   * 构建系统提示词
   * 注入项目上下文、当前页面信息、用户信息
   */
  function buildSystemPrompt(): string {
    const route = useRoute()
    const contextParts: string[] = []

    // 项目基础信息
    contextParts.push(store.config.systemPrompt)

    // 当前页面上下文
    if (route) {
      const pageName = (route.meta?.name as string) || ''
      contextParts.push(`\n## 实时上下文`)
      contextParts.push(`- 当前页面路由: ${route.fullPath}`)
      if (pageName) {
        contextParts.push(`- 当前页面名称: ${pageName}`)
      }
    }

    // 用户信息（脱敏）
    if (userStore.userInfo?.nickName) {
      contextParts.push(`- 当前用户昵称: ${userStore.userInfo.nickName}`)
    }

    return contextParts.join('\n')
  }

  // ==================== 核心方法 ====================

  /**
   * 发送消息
   * @param content - 可选，为空时使用 inputText
   */
  async function send(content?: string): Promise<void> {
    const text = (content ?? inputText.value).trim()
    if (!text) return
    if (store.isSending) return

    // 清空输入框
    if (!content) {
      inputText.value = ''
    }
    error.value = null
    store.isSending = true

    try {
      // 添加用户消息
      store.addMessage({ role: 'user', content: text })

      // 添加助手占位消息
      store.addMessage({ role: 'assistant', content: '', isStreaming: true })

      // 构建完整消息列表（system prompt + 历史消息 + 当前用户消息）
      const allMessages = store.activeConversation!.messages
      const apiMessages: { role: string; content: string }[] = [
        { role: 'system', content: buildSystemPrompt() },
      ]

      // 添加对话中的消息（排除最后一条空的 assistant 占位消息和系统消息）
      for (const msg of allMessages.slice(0, -1)) {
        if (msg.role !== 'system') {
          apiMessages.push({ role: msg.role, content: msg.content })
        }
      }

      // 发送请求
      currentController = sendChatMessage(apiMessages, {
        onChunk: (text: string) => {
          store.appendToLastAssistantMessage(text)
        },
        onDone: () => {
          store.finishLastAssistantMessage()
          store.isSending = false
          currentController = null
        },
        onError: (err: Error) => {
          store.appendToLastAssistantMessage(`\n\n> ⚠️ 发送失败：${err.message}`)
          store.finishLastAssistantMessage()
          error.value = err.message
          store.isSending = false
          currentController = null
        },
      })
    } catch (err: any) {
      error.value = err.message || '发送失败'
      store.isSending = false
      store.appendToLastAssistantMessage(`\n\n> ⚠️ 发送失败：${err.message || '未知错误'}`)
      store.finishLastAssistantMessage()
    }
  }

  /** 取消当前正在进行的请求 */
  function cancel() {
    if (currentController) {
      currentController.abort()
      currentController = null
      store.finishLastAssistantMessage()
      store.isSending = false
    }
  }

  /** 重新生成最后一条回复 */
  async function regenerate(): Promise<void> {
    const conv = store.activeConversation
    if (!conv) return

    const msgs = conv.messages

    // 移除最后一条助手消息
    if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant') {
      msgs.pop()
    }

    // 如果最后一条是用户消息，重新发送
    const lastUserMsg = [...msgs].reverse().find((m) => m.role === 'user')
    if (lastUserMsg) {
      await send(lastUserMsg.content)
    }
  }

  /** 重试（发送失败后） */
  async function retry(): Promise<void> {
    error.value = null

    const conv = store.activeConversation
    if (!conv) return

    const msgs = conv.messages

    // 移除最后一条出错的助手消息
    if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant') {
      msgs.pop()
    }

    // 重新发送最后一条用户消息
    const lastUserMsg = [...msgs].reverse().find((m) => m.role === 'user')
    if (lastUserMsg) {
      await send(lastUserMsg.content)
    }
  }

  /** 滚动消息列表到底部 */
  function scrollToBottom() {
    nextTick(() => {
      if (messageListRef.value) {
        messageListRef.value.scrollTop = messageListRef.value.scrollHeight
      }
    })
  }

  /** 清理（组件卸载时调用） */
  function cleanup() {
    cancel()
    currentController = null
  }

  // ==================== 返回 ====================

  return {
    // 来自 store
    conversations: computed(() => store.conversations),
    activeConversation: computed(() => store.activeConversation),
    messages: computed(() => store.messages),
    config: computed(() => store.config),
    isSending: computed(() => store.isSending),
    isOpen: computed(() => store.isOpen),

    // 本地状态
    inputText,
    error,
    messageListRef,

    // 方法
    send,
    cancel,
    regenerate,
    retry,
    scrollToBottom,
    cleanup,
    newConversation: store.newConversation,
    deleteConversation: store.deleteConversation,
    switchConversation: store.switchConversation,
    togglePanel: store.togglePanel,
  }
}
