import { defineStore } from 'pinia'
import { nanoid } from 'nanoid'
import type { AiConversation, AiMessage, AiProviderConfig } from '@/ai/types/ai'
import { DEFAULT_MODEL, DEFAULT_SYSTEM_PROMPT, MAX_CONVERSATION_TITLE_LENGTH } from '@/ai/constants'

export const useAiChatStore = defineStore(
  'aiChat',
  () => {
    // ==================== 状态 ====================

    /** 所有对话列表 */
    const conversations = ref<AiConversation[]>([])

    /** 当前活跃对话 ID */
    const activeConversationId = ref<string>('')

    /** Provider 配置 */
    const config = ref<AiProviderConfig>({
      model: DEFAULT_MODEL,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
    })

    /** 面板是否展开 */
    const isOpen = ref(false)

    /** 是否正在发送消息 */
    const isSending = ref(false)

    // ==================== 计算属性 ====================

    /** 当前活跃对话 */
    const activeConversation = computed<AiConversation | null>(() =>
      conversations.value.find((c) => c.id === activeConversationId.value) ?? null
    )

    /** 当前对话的消息列表 */
    const messages = computed<AiMessage[]>(() => activeConversation.value?.messages ?? [])

    // ==================== 方法 ====================

    /** 创建新对话，返回对话 ID */
    function newConversation(): string {
      const id = nanoid()
      const conv: AiConversation = {
        id,
        title: '新对话',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      conversations.value.unshift(conv)
      activeConversationId.value = id
      return id
    }

    /** 切换到指定对话 */
    function switchConversation(id: string) {
      if (conversations.value.some((c) => c.id === id)) {
        activeConversationId.value = id
      }
    }

    /** 删除对话 */
    function deleteConversation(id: string) {
      conversations.value = conversations.value.filter((c) => c.id !== id)
      // 如果删除的是活跃对话，自动切换到第一个
      if (activeConversationId.value === id) {
        activeConversationId.value = conversations.value[0]?.id ?? ''
      }
    }

    /** 添加消息到当前活跃对话 */
    function addMessage(msg: Omit<AiMessage, 'id' | 'timestamp'>) {
      // 确保有活跃对话
      if (!activeConversationId.value) {
        newConversation()
      }

      const conv = activeConversation.value
      if (!conv) return

      const newMsg: AiMessage = {
        ...msg,
        id: nanoid(),
        timestamp: Date.now(),
      }

      conv.messages.push(newMsg)
      conv.updatedAt = Date.now()

      // 首条用户消息自动设为对话标题
      if (conv.title === '新对话' && newMsg.role === 'user') {
        conv.title =
          newMsg.content.length > MAX_CONVERSATION_TITLE_LENGTH
            ? newMsg.content.slice(0, MAX_CONVERSATION_TITLE_LENGTH) + '...'
            : newMsg.content
      }

      // 限制消息数量
      if (conv.messages.length > 100) {
        conv.messages = conv.messages.slice(-100)
      }
    }

    /** 增量更新当前对话的最后一条助手消息 */
    function appendToLastAssistantMessage(delta: string) {
      const conv = activeConversation.value
      if (!conv) return
      const lastMsg = conv.messages[conv.messages.length - 1]
      if (lastMsg && lastMsg.role === 'assistant') {
        lastMsg.content += delta
      }
    }

    /** 完成最后一条助手消息的流式输出 */
    function finishLastAssistantMessage() {
      const conv = activeConversation.value
      if (!conv) return
      const lastMsg = conv.messages[conv.messages.length - 1]
      if (lastMsg && lastMsg.role === 'assistant') {
        lastMsg.isStreaming = false
      }
    }

    /** 切换面板展开/收起 */
    function togglePanel() {
      isOpen.value = !isOpen.value
    }

    /** 清空所有对话历史 */
    function clearAllHistory() {
      conversations.value = []
      activeConversationId.value = ''
    }

    return {
      conversations,
      activeConversationId,
      config,
      isOpen,
      isSending,
      activeConversation,
      messages,
      newConversation,
      switchConversation,
      deleteConversation,
      addMessage,
      appendToLastAssistantMessage,
      finishLastAssistantMessage,
      togglePanel,
      clearAllHistory,
    }
  },
  {
    persist: {
      key: 'aiChat',
      storage: window.localStorage,
    },
  }
)
