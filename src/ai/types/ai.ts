// AI 聊天相关类型定义

/** 消息角色 */
export type AiRole = 'user' | 'assistant' | 'system'

/** 单条聊天消息 */
export interface AiMessage {
  id: string
  role: AiRole
  content: string
  timestamp: number
  /** 是否正在流式输出中 */
  isStreaming?: boolean
}

/** 对话 */
export interface AiConversation {
  id: string
  /** 自动截取首条用户消息作为标题 */
  title: string
  /** 使用的模型 */
  model?: string
  messages: AiMessage[]
  createdAt: number
  updatedAt: number
}

/** API 请求格式（OpenAI 兼容） */
export interface AiChatRequest {
  messages: { role: string; content: string }[]
  model?: string
  stream: boolean
}

/** Provider 配置 */
export interface AiProviderConfig {
  /** Phase 1 为空，由后端持有 */
  apiKey?: string
  model: string
  /** Phase 1 为空，由后端持有 */
  baseUrl?: string
  systemPrompt: string
}

/** SSE 流回调 */
export interface AiStreamCallbacks {
  onChunk: (text: string) => void
  onDone: () => void
  onError: (error: Error) => void
}
