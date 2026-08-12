# AI Chat Widget — 阶段一实施计划

## 背景

在现有的 Vue 3 博客管理系统中引入 AI 助手能力。阶段一目标是实现一个**全局可用的 AI 聊天组件**，支持流式对话、历史持久化和项目上下文感知，为后续的阶段二（行为分析）和阶段三（场景化功能）奠定架构基础。

## 技术方案概览

```
用户输入消息 → useAiChat composable → Pinia store (添加消息)
                                     → fetch SSE（手动加 Auth header）→ /backapi/ai/chat
                                     → ReadableStream 解析
                                     → 逐字更新 assistant 消息
```

- **LLM**: OpenAI 兼容 API，通过 Python 后端代理（API Key 安全存放在后端）
- **流式**: 前端用原生 `fetch` + `ReadableStream` 解析 SSE（不用 Axios，因其不支持流）
- **Auth**: 手动从 `useUserInfoStore().token` 获取 token，加到 fetch headers
- **持久化**: Pinia + persistedstate 插件（匹配现有 pattern，key: `'aiChat'`, storage: `localStorage`）
- **主题**: CSS 自定义属性（`--sys-bg-color`, `--sys-text-color`, `--sys-border-color`, `--theme-color`）
- **Markdown 渲染**: 复用已全局注册的 `<v-md-preview>` 组件（VuePress 主题 + 代码高亮 + emoji）
- **图标**: 使用 `AppIcon` 包装组件（`name="robot"`），匹配项目图标使用习惯
- **挂载点**: `App.vue` 中 `<SysSettings>` 同级，作为全局浮动组件

## 新建文件（7 个）

> **自动导入提示**：由于 `unplugin-auto-import` 的配置，以下内容已全局可用，**无需手动 import**：
> - Vue API：`ref`, `computed`, `watch`, `onMounted`, `onUnmounted`, `nextTick`, `reactive` 等
> - Router：`useRoute`, `useRouter`
> - Element Plus：`ElMessage`（函数），所有 `El*` 组件（通过 `unplugin-vue-components`）
> - 工具函数：`confirmHandler`, `copyClick`, `getCookie`, `fmtTime` 等（来自 `src/utils/tool`）
> - 需手动导入的：Pinia stores（`@/store/xxx` 或 `@/ai/store/xxx`），自定义类型（`@/ai/types/ai`），第三方库（`nanoid`, `dayjs` 等）

### 1. `src/ai/types/ai.ts` — 类型定义

```typescript
// 消息角色
type AiRole = 'user' | 'assistant' | 'system'

// 单条消息
interface AiMessage {
  id: string
  role: AiRole
  content: string
  timestamp: number
  isStreaming?: boolean  // 是否正在流式输出中
}

// 对话
interface AiConversation {
  id: string
  title: string           // 自动截取首条用户消息
  messages: AiMessage[]
  createdAt: number
  updatedAt: number
}

// API 请求格式（OpenAI 兼容）
interface AiChatRequest {
  messages: { role: string; content: string }[]
  model?: string
  stream: boolean
}

// Provider 配置
interface AiProviderConfig {
  apiKey?: string         // Phase 1 为空，由后端持有
  model: string
  baseUrl?: string        // Phase 1 为空，由后端持有
  systemPrompt: string
}
```

### 2. `src/ai/store/aiChat.ts` — Pinia Store

匹配现有 store pattern（`defineStore` + setup 函数 + persistedstate）：

```typescript
export const useAiChatStore = defineStore('aiChat', () => {
  // 状态
  const conversations = ref<AiConversation[]>([])
  const activeConversationId = ref<string>('')
  const config = ref<AiProviderConfig>({ model: 'deepseek-v4-pro', systemPrompt: '' })
  const isOpen = ref(false)         // 面板展开/收起
  const isSending = ref(false)      // 是否正在发送消息

  // 计算属性
  const activeConversation = computed(() => ...)
  const messages = computed(() => activeConversation.value?.messages ?? [])

  // 方法
  function newConversation(): string { ... }
  function switchConversation(id: string) { ... }
  function deleteConversation(id: string) { ... }
  function addMessage(msg: AiMessage) { ... }
  function updateMessage(id: string, content: string) { ... }
  function togglePanel() { ... }
  function clearAllHistory() { ... }

  return { conversations, activeConversationId, config, isOpen, isSending,
           activeConversation, messages, newConversation, switchConversation,
           deleteConversation, addMessage, updateMessage, togglePanel, clearAllHistory }
}, {
  persist: { key: 'aiChat', storage: window.localStorage }
})
```

关键设计：
- 每条对话独立存储 messages
- `isSending` 控制发送按钮禁用和 loading 展示
- 流式输出时逐 chunk 调用 `updateMessage` 更新内容
- 对话标题自动取首条用户消息的前 30 个字符

### 3. `src/ai/services/aiApi.ts` — SSE 流式 API

使用原生 `fetch`（非 Axios，因为需要 ReadableStream 支持）。

从 `useUserInfoStore` 获取 token，手动添加到请求头（绕过 Axios 拦截器，但保持认证）。

```typescript
import { useUserInfoStore } from '@/store/user'
import { nanoid } from 'nanoid'

export function sendChatMessage(
  messages: { role: string; content: string }[],
  callbacks: {
    onChunk: (text: string) => void
    onDone: () => void
    onError: (error: Error) => void
  }
): AbortController {
  const abortController = new AbortController()
  const userStore = useUserInfoStore()

  fetch('/backapi/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(userStore.token ? { Authorization: userStore.token } : {}),
    },
    body: JSON.stringify({ messages, stream: true }),
    signal: abortController.signal,
  })
    .then(async (response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) { callbacks.onDone(); break }
        
        buffer += decoder.decode(value, { stream: true })
        // 解析 SSE 格式: "data: {...}\n\n"
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''  // 保留未完成的行
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') { callbacks.onDone(); return }
            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) callbacks.onChunk(content)
            } catch { /* 跳过解析失败的行 */ }
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') callbacks.onError(err)
    })

  return abortController
}
```

**关键点**：
- 手动从 Pinia store 获取 token（`useUserInfoStore().token`），不依赖 Axios 拦截器
- `AbortController` 支持用户取消正在生成的回复
- buffer 处理 SSE 分片到达的情况（不完整的行留在 buffer 等待下一 chunk）
- `[DONE]` 标记流结束
- `AbortError` 不视为错误（用户主动取消）

### 4. `src/ai/composables/useAiChat.ts` — 核心逻辑

```typescript
export function useAiChat() {
  const store = useAiChatStore()
  const router = useRouter()
  const route = useRoute()
  const userStore = useUserInfoStore()
  const abortController = ref<AbortController | null>(null)

  // 构建系统提示词（注入项目上下文）
  function buildSystemPrompt(): string { ... }

  // 发送消息的主方法
  async function send(content: string): Promise<void> { ... }

  // 取消当前流式输出
  function cancelStream(): void { ... }

  // 重新生成最后一条回复
  async function regenerate(): Promise<void> { ... }

  return { send, cancelStream, regenerate, isSending: computed(() => store.isSending) }
}
```

**`buildSystemPrompt` 上下文注入**（阶段一基础版）：
```
你是一个博客管理系统的AI助手，帮助用户管理他们的博客内容。

当前页面: ${route.meta.name}
页面路径: ${route.fullPath}

项目技术栈: Vue 3 + TypeScript + Element Plus + Pinia + Vite

请用中文回答。回答简洁、实用，给出可操作的建议。
```

后续阶段可扩展：注入文章内容、操作历史、行为分析等。

**`send` 方法流程**：
1. 检查是否为空消息 → 直接返回
2. 如果没有活跃对话，调用 `store.newConversation()`
3. 构建用户消息 `AiMessage`，调用 `store.addMessage()`
4. 构建助手占位消息（空 content，`isStreaming: true`）
5. 组装 messages 数组（system prompt + 历史消息 + 新消息）
6. 调用 `sendChatMessage`，在 `onChunk` 中增量更新助手消息
7. 流结束：标记 `isStreaming: false`
8. 错误处理：更新助手消息为错误提示

### 5. `src/ai/components/AiChatPanel.vue` — 聊天面板 UI

核心聊天界面，在抽屉/浮动面板内渲染：

**模板结构**：
```html
<div class="ai-chat-panel flex flex-col h-full">
  <!-- 顶部标题栏 -->
  <div class="panel-header">
    <span>AI 助手</span>
    <div class="header-actions">
      <button @click="store.newConversation()">新对话</button>
      <button @click="store.togglePanel()">关闭</button>
    </div>
  </div>

  <!-- 消息列表 -->
  <div ref="messageListRef" class="message-list flex-1 overflow-auto p-4">
    <div v-if="store.messages.length === 0" class="empty-state">
      欢迎使用 AI 助手，请输入你的问题...
    </div>
    <div v-for="msg in store.messages" :key="msg.id" class="message-item">
      <!-- 用户消息 -->
      <div v-if="msg.role === 'user'" class="user-message">...</div>
      <!-- 助手消息（使用全局注册的 v-md-preview 组件渲染 Markdown） -->
      <div v-else class="assistant-message">
        <v-md-preview :text="msg.content" />
        <span v-if="msg.isStreaming" class="typing-cursor">|</span>
      </div>
      <!-- 错误/重试 -->
      <div v-if="msg.role === 'error'" class="error-message">
        发送失败 <button @click="retry(msg)">重试</button>
      </div>
    </div>
  </div>

  <!-- 输入区域 -->
  <div class="input-area p-3 border-t">
    <el-input v-model="inputText" @keydown.enter="handleSend"
              :disabled="isSending" placeholder="输入消息..." />
    <el-button @click="handleSend" :loading="isSending">发送</el-button>
  </div>
</div>
```

**关键细节**：
- 新消息到达时自动滚动到底部（`watch` + `nextTick` + `scrollTop`）
- 使用 `v-md-preview` 指令渲染 Markdown（复用现有的 v-md-editor 预览能力）
- 打字光标动画（闪烁的 `|`）
- 使用 `var(--sys-bg-color)`、`var(--sys-text-color)`、`var(--sys-border-color)` 适配主题
- 用户消息靠右（蓝色气泡），AI 消息靠左

### 6. `src/ai/components/AiChatWidget.vue` — 悬浮入口 + 容器

**方案选择**：使用自定义浮动面板（非 ElDrawer），因为聊天助手更适合浮层而不是侧边抽屉。

```html
<div class="ai-chat-widget">
  <!-- 浮动触发按钮（使用 AppIcon 匹配项目图标习惯） -->
  <div v-if="!store.isOpen" class="trigger-btn" @click="store.togglePanel()">
    <AppIcon name="robot" :size="24" color="#fff" />
  </div>

  <!-- 聊天面板 -->
  <div v-else class="chat-container">
    <AiChatPanel />
  </div>
</div>
```

**样式**：
- 容器：`position: fixed; bottom: 5rem; right: 1rem; z-index: 2500`
- 触发按钮：圆形 48x48px，使用 `var(--theme-color)` 背景，匹配 SysSettings 的 `wrapper-solid-item` 风格
- `z-index: 2500` 确保在 Element Plus drawer（默认 2000+）之上
- 位置避开 SysSettings 按钮（SysSettings 在左下角，不冲突）

**面板尺寸**：宽 420px，高 600px，带圆角和阴影，使用 `var(--sys-box-bg-color)` 背景

### 7. `src/ai/constants.ts` — 默认配置

```typescript
export const DEFAULT_SYSTEM_PROMPT = `...`   // 基础系统提示词
export const DEFAULT_MODEL = 'deepseek-v4-pro'
export const AI_CHAT_STORAGE_KEY = 'aiChat'
export const MAX_MESSAGES_PER_CONVERSATION = 100
```

## 修改文件（1 个）

### `src/App.vue`

在 `<SysSettings>` 旁边添加 AiChatWidget：

```vue
<template>
  <div class="app">
    <router-view v-slot="{ Component }">
      <transition>
        <component :is="Component" />
      </transition>
    </router-view>
    <SysSettings></SysSettings>
    <AiChatWidget></AiChatWidget>   <!-- 新增 -->
  </div>
</template>
```

## 后端需求文档（供参考，不在本次实施范围）

用户的 Python 后端（`http://127.0.0.1:8000`）需新增端点：

```
POST /ai/chat
Content-Type: application/json

Request:
{
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "..."}
  ],
  "model": "deepseek-v4-pro",    // 可选
  "stream": true
}

Response:
Content-Type: text/event-stream

data: {"id":"...","choices":[{"delta":{"content":"你好"}}]}

data: {"id":"...","choices":[{"delta":{"content":"！"}}]}

data: [DONE]
```

Python 实现参考（FastAPI 示例）：
```python
import httpx
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/chat")
async def chat(request: Request):
    body = await request.json()
    async def generate():
        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {API_KEY}"},
                json=body
            ) as response:
                async for chunk in response.aiter_bytes():
                    yield chunk
    return StreamingResponse(generate(), media_type="text/event-stream")
```

## 实施顺序

| 步骤 | 文件 | 说明 |
|------|------|------|
| 1 | `src/ai/types/ai.ts` | 类型定义，无依赖 |
| 2 | `src/ai/constants.ts` | 默认配置常量 |
| 3 | `src/ai/store/aiChat.ts` | Pinia store，依赖 types |
| 4 | `src/ai/services/aiApi.ts` | SSE fetch 封装 |
| 5 | `src/ai/composables/useAiChat.ts` | 聊天核心逻辑，依赖 store + services |
| 6 | `src/ai/components/AiChatPanel.vue` | 聊天 UI，依赖 composable + store |
| 7 | `src/ai/components/AiChatWidget.vue` | 悬浮按钮容器，依赖 Panel |
| 8 | `src/App.vue` | 挂载 Widget |

## 验证方案

1. **TypeScript 编译检查**：`npx vue-tsc --noEmit` 确保类型正确
2. **构建验证**：`npm run build` 确保能正常打包
3. **开发模式验证**：
   - `npm run dev` 启动，检查右下角是否有 AI 助手按钮
   - 点击按钮，面板正常弹出
   - 发送消息，观察流式回复（需后端代理就绪）
   - 刷新页面，确认历史消息持久化
   - 切换明暗模式，确认面板主题跟随
4. **边界情况**：
   - 空消息不应发送
   - 网络错误应显示错误提示 + 重试按钮
   - 快速连续发送不应导致状态错乱
   - 长消息应正常滚动

## 架构预留（阶段二/三的扩展点）

- `AiProviderConfig` 中的 `apiKey` 和 `baseUrl` 字段（阶段二支持直接配置）
- `buildSystemPrompt` 的可扩展性（注入更多上下文）
- Store 中的 `conversations` 数组支持多轮对话
- Event bus 可用于触发场景化 AI 功能（"分析当前文章"等）
