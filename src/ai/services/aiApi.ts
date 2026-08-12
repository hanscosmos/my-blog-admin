import request from '@/utils/request'
import { useUserInfoStore } from '@/store/user'
import type { AiStreamCallbacks, AiConversation, AiMessage } from '@/ai/types/ai'

/**
 * 发送聊天消息（SSE 流式）
 * 使用原生 fetch 而非 Axios，因为需要 ReadableStream 支持
 *
 * @param messages - 消息数组（不含 system prompt，由 composable 负责注入）
 * @param callbacks - 流式回调
 * @returns AbortController，可用于取消请求
 */
export function sendChatMessage(
  messages: { role: string; content: string }[],
  callbacks: AiStreamCallbacks,
  conversationId?: string,
): AbortController {
  const abortController = new AbortController()
  const userStore = useUserInfoStore()

  fetch('/backapi/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(userStore.token ? { Authorization: userStore.token } : {}),
    },
    body: JSON.stringify({
      messages,
      stream: true,
      ...(conversationId ? { conversationId } : {}),
    }),
    signal: abortController.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`请求失败 (${response.status})`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('浏览器不支持流式读取')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            callbacks.onDone()
            break
          }

          buffer += decoder.decode(value, { stream: true })

          // SSE 格式：事件之间用 \n\n 分隔
          const lines = buffer.split('\n')
          // 保留最后一个可能不完整的行
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              if (data === '[DONE]') {
                callbacks.onDone()
                return
              }
              try {
                const parsed = JSON.parse(data)
                // 兼容 OpenAI 格式: choices[0].delta.content
                const content = parsed.choices?.[0]?.delta?.content
                // 兼容简化格式: content
                const simpleContent = parsed.content
                const delta = content ?? simpleContent

                if (delta) {
                  callbacks.onChunk(delta)
                }

                // 检查是否完成
                if (parsed.done) {
                  callbacks.onDone()
                  return
                }
              } catch {
                // 跳过无法解析的行
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          callbacks.onError(err)
        }
      } finally {
        // 确保 reader 被释放
        try {
          reader.cancel()
        } catch {
          // ignore
        }
      }
    })
    .catch((err: Error) => {
      if (err.name !== 'AbortError') {
        callbacks.onError(err)
      }
    })

  return abortController
}

/**
 * 简单的心跳检测 —— 测试后端 /ai/chat 是否可达
 */
export async function pingAiService(): Promise<boolean> {
  try {
    const response = await fetch('/backapi/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'ping' }],
        stream: false,
      }),
    })
    return response.ok
  } catch {
    return false
  }
}

// ==================== 对话 CRUD（基于 request 工具，非流式） ====================

/** 获取当前用户的对话列表 */
export function fetchConversationsApi(): Promise<{ code: number; msg: string; data: AiConversation[] }> {
  return request.get('/ai/conversations')
}

/** 获取单个对话的详情（含消息列表） */
export function fetchConversationApi(conversationId: string): Promise<{
  code: number
  msg: string
  data: { conversation: AiConversation; messages: AiMessage[] }
}> {
  return request.get(`/ai/conversations/${conversationId}`)
}

/** 新建对话 */
export function createConversationApi(data: { title?: string; model?: string }): Promise<{
  code: number
  msg: string
  data: { id: string }
}> {
  return request.post('/ai/conversations/create', data)
}

/** 删除对话 */
export function deleteConversationApi(conversationId: string): Promise<{ code: number; msg: string }> {
  return request.post(`/ai/conversations/${conversationId}/delete`)
}

/** 更新对话标题 */
export function updateConversationApi(conversationId: string, title: string): Promise<{ code: number; msg: string }> {
  return request.post(`/ai/conversations/${conversationId}/update`, { title })
}
