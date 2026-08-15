import { useAiChatStore } from '@/ai/store/aiChat'
import { useArticleEditorStore } from '@/ai/store/articleEditor'
import { sendChatMessage, fetchConversationsApi, fetchConversationApi, deleteConversationApi, updateConversationApi } from '@/ai/services/aiApi'
import { useUserInfoStore } from '@/store/user'
import type { AiConversation, AiMessage } from '@/ai/types/ai'

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
  const articleEditorStore = useArticleEditorStore()
  const route = useRoute()

  // ==================== 状态 ====================

  /** 输入框文本 */
  const inputText = ref('')

  /** 错误信息 */
  const error = ref<string | null>(null)

  /** 当前请求的 AbortController */
  let currentController: AbortController | null = null

  /** 消息列表容器引用 */
  const messageListRef = ref<HTMLElement | null>(null)

  /** 是否正在加载历史数据 */
  const isLoadingHistory = ref(false)

  // ==================== 上下文构建 ====================

  /**
   * 构建系统提示词
   * 注入项目上下文、当前页面信息、用户信息
   */
  function buildSystemPrompt(): string {
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

      // 当前正在浏览/编辑的文章
      if (route.name === 'ArticleDetail') {
        const articleId = typeof route.query?.id === 'string' ? route.query.id : ''
        if (articleId) {
          contextParts.push(`- 当前正在浏览的文章 id: ${articleId}`)
          contextParts.push(`（用户说的「这篇文章」即指上面 id 对应的文章，请调用 get_article_content 工具读取其正文）`)
        }
      } else if (route.name === 'ReleaseArticle' || route.name === 'UpdateArticle') {
        // 发布/编辑页：正文来自前端编辑器文本框，可能尚未保存，直接读编辑器内容而非查库
        const editorContent = articleEditorStore.content
        if (editorContent.trim()) {
          contextParts.push(`\n## 当前正在编辑的文章（来自编辑器文本框，可能尚未保存）`)
          if (articleEditorStore.title) {
            contextParts.push(`- 标题: ${articleEditorStore.title}`)
          }
          const truncated = editorContent.length > 8000
          contextParts.push(`- 正文:\n${editorContent.slice(0, 8000)}${truncated ? '\n…(内容过长已截断)' : ''}`)
          contextParts.push(`（直接基于上面的正文分析，无需再读取数据库）`)
        }
      }
    }

    // 用户信息（脱敏）
    if (userStore.userInfo?.nickName) {
      contextParts.push(`- 当前用户昵称: ${userStore.userInfo.nickName}`)
    }

    return contextParts.join('\n')
  }

  // ==================== 后端同步 ====================

  /**
   * 从后端加载所有对话列表
   * 若后端无数据，则使用本地 localStorage 中的对话
   */
  async function loadConversations(): Promise<void> {
    if (store.hasLoadedFromServer) return

    try {
      const res = await fetchConversationsApi()
      if (res.code === 0 && res.data) {
        // 将后端数据转为前端格式
        const convs: AiConversation[] = res.data.map((c: any) => ({
          id: c.id,
          title: c.title,
          model: c.model,
          messages: [],
          createdAt: c.createTime ? new Date(c.createTime).getTime() : Date.now(),
          updatedAt: c.updateTime ? new Date(c.updateTime).getTime() : Date.now(),
        }))
        store.setConversations(convs)

        // 有历史对话则自动打开第一个，无则新建
        if (convs.length > 0) {
          store.switchConversation(convs[0].id)
        } else {
          store.newConversation()
        }
      }
    } catch {
      // 后端不可用时，使用本地数据
      if (store.conversations.length === 0) {
        store.newConversation()
      }
      store.hasLoadedFromServer = true
    }
  }

  /**
   * 从后端加载某个对话的完整消息列表
   */
  async function loadConversationMessages(conversationId: string): Promise<void> {
    // 本地已有消息则跳过
    const conv = store.conversations.find((c) => c.id === conversationId)
    if (conv && conv.messages.length > 0) return

    try {
      isLoadingHistory.value = true
      const res = await fetchConversationApi(conversationId)
      if (res.code === 0 && res.data) {
        const msgs: AiMessage[] = (res.data.messages || []).map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.createTime ? new Date(m.createTime).getTime() : Date.now(),
          promptTokens: m.promptTokens,
          completionTokens: m.completionTokens,
        }))
        store.setConversationMessages(conversationId, msgs)
      }
    } catch {
      // 加载失败，继续使用本地数据
    } finally {
      isLoadingHistory.value = false
    }
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

      // 发送请求，携带 conversationId 让后端存储消息
      currentController = sendChatMessage(
        apiMessages,
        {
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
        },
        store.activeConversationId || undefined,
      )
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

  // ==================== 对话操作 ====================

  /** 新建对话 */
  function newConversation() {
    store.newConversation()
    error.value = null
  }

  /** 删除对话（同步删除后端） */
  async function deleteConversation(id: string): Promise<void> {
    store.removeConversation(id)
    try {
      await deleteConversationApi(id)
    } catch {
      // 后端删除失败时静默处理
    }
  }

  /** 重命名对话 */
  async function renameConversation(id: string, title: string): Promise<void> {
    const trimmed = title.trim()
    if (!trimmed) return

    store.updateConversationTitle(id, trimmed)
    try {
      await updateConversationApi(id, trimmed)
    } catch {
      // 后端更新失败时静默处理，前端已经更新
    }
  }

  /** 切换对话，自动加载消息历史 */
  async function switchConversation(id: string): Promise<void> {
    store.switchConversation(id)
    await loadConversationMessages(id)
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
    activeConversationId: computed(() => store.activeConversationId),
    messages: computed(() => store.messages),
    config: computed(() => store.config),
    isSending: computed(() => store.isSending),
    isOpen: computed(() => store.isOpen),

    // 本地状态
    inputText,
    error,
    messageListRef,
    isLoadingHistory,

    // 方法
    send,
    cancel,
    regenerate,
    retry,
    scrollToBottom,
    cleanup,
    loadConversations,
    loadConversationMessages,
    newConversation,
    deleteConversation,
    renameConversation,
    switchConversation,
    togglePanel: store.togglePanel,
  }
}
