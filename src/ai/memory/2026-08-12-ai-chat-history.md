# AI 聊天助手历史记录功能（2026-08-12）

## 需求背景

AI 聊天助手需要支持历史记录功能：用户关闭面板/刷新页面后能恢复之前的对话，以及跨设备同步历史消息。

当前状态：Store 层已有多对话数据结构（`conversations` 数组），但仅通过 `pinia-plugin-persistedstate` 存 localStorage，缺少：
- 对话列表/切换的 UI
- 服务端持久化
- 跨设备同步能力

## 关键发现与分析

### 架构决策

1. **"本地优先 + 后台异步同步"**：前端 `openPanel → loadConversations()` 初始化拉取列表；切换对话时加载消息；发送消息后后端自动入库。后端不可用时前端降级使用本地 localStorage 数据。

2. **表设计遵循项目规范**：
   - UUID 主键，不用自增 ID
   - 不用 Django `ForeignKey`，全部裸 `UUIDField`（与项目所有现有 Model 一致）
   - snake_case 数据库列名，camelCase Python 字段名（通过 `db_column` 映射）
   - 表前缀 `blog_`（内容相关表）
   - 仅 ai 模块 migration：`python manage.py makemigrations ai && python manage.py migrate ai`

3. **nanoid 与 UUID 冲突**：前端用 `nanoid()` 生成对话 ID，后端 Django `UUIDField` 拒绝非 UUID 格式。解决方案：全部改用 `crypto.randomUUID()`（浏览器原生 API，生成标准 UUID v4）。

### 数据库表设计

**`blog_ai_conversation`**

| 字段 | 类型 | 说明 |
|------|------|------|
| `conversation_id` | UUID PK | 对话标识 |
| `user_id` | UUID | 关联 sys_user |
| `title` | CharField(64) | 对话标题 |
| `model` | CharField(32) | 使用的模型，默认 `deepseek-v4-pro` |
| `create_time` | DateTime | auto_now_add |
| `update_time` | DateTime | auto_now |

**`blog_ai_message`**

| 字段 | 类型 | 说明 |
|------|------|------|
| `message_id` | UUID PK | 消息标识 |
| `conversation_id` | UUID | 所属对话 |
| `role` | CharField(16) | user / assistant / system |
| `content` | TextField | 消息正文 |
| `prompt_tokens` | Integer (nullable) | 输入 token 数 |
| `completion_tokens` | Integer (nullable) | 输出 token 数 |
| `create_time` | DateTime | auto_now_add |

### Token 统计

通过请求上游 API 时附加 `stream_options: {'include_usage': True}`，上游会在流式最后一个 chunk 中返回 `usage` 对象（`prompt_tokens`/`completion_tokens`）。后端解析后回填到 assistant 消息记录。用户消息不记录 token。

## 改动清单

### 后端（my-blog-service）

| 文件 | 操作 | 说明 |
|------|------|------|
| `modules/ai/models.py` | **新增** | `AiConversation`、`AiMessage` 两个 Model |
| `modules/ai/migrations/0001_initial.py` | 自动生成 | 仅 ai 模块的 migration |
| `modules/ai/views/conversation.py` | **新增** | 对话 CRUD：列表、详情（含消息）、新建、删除、**更新标题** |
| `modules/ai/views/chat.py` | **修改** | 流式聊天时自动存 user/assistant 消息 + 提取 token 用量 |
| `modules/ai/urls.py` | **修改** | 新增 5 条路由 |

### 后端 API 路由

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/backapi/ai/conversations` | 获取对话列表 |
| `GET` | `/backapi/ai/conversations/<id>` | 获取对话详情（含消息） |
| `POST` | `/backapi/ai/conversations/create` | 新建对话 |
| `POST` | `/backapi/ai/conversations/<id>/delete` | 删除对话（级联删消息） |
| `POST` | `/backapi/ai/conversations/<id>/update` | 更新对话标题 |

### 前端（my-blog-admin）

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/ai/types/ai.ts` | 修改 | `AiConversation` 加 `model` 字段 |
| `src/ai/services/aiApi.ts` | 修改 | `sendChatMessage` 支持 `conversationId`；新增 5 个 CRUD API 方法 |
| `src/ai/store/aiChat.ts` | 修改 | `nanoid → crypto.randomUUID()`；新增加 `setConversations`、`removeConversation`、`setConversationMessages`、`updateConversationTitle`、`hasLoadedFromServer` |
| `src/ai/composables/useAiChat.ts` | 重写 | 新增 `loadConversations`、`loadConversationMessages`、`renameConversation` 等后端同步逻辑 |
| `src/ai/components/AiChatPanel.vue` | 重写 | 新增左侧对话列表侧边栏，支持切换/删除/双击编辑标题 |

### 数据流

```
打开面板 → loadConversations() → GET /ai/conversations → 填充侧边栏
点击对话 → switchConversation() → GET /ai/conversations/:id → 加载消息
发送消息 → send() 携带 conversationId → POST /ai/chat (SSE)
  → 后端流式转发 + 存 user/assistant 消息 + 回填 token
修改标题 → renameConversation() → 前端更新 + POST /ai/conversations/:id/update
删除对话 → deleteConversation() → POST /ai/conversations/:id/delete → 前后端同步删除
```

## 后续注意事项

- **Token 统计依赖**：上游 API 需支持 `stream_options: {'include_usage': True}`，目前 deepseek API 兼容此参数
- **对话消息上限**：前端限制每对话 100 条（`MAX_MESSAGES_PER_CONVERSATION`），后端无限制
- **后端不可用降级**：`loadConversations()` catch 中会回退到 localStorage 数据
- **关闭 `close()` 钩子**：`chat.py` 通过 monkey-patch `StreamingHttpResponse.close()` 在流结束后写库，这在大多数 WSGI 环境下工作正常，但非标准做法；如果遇到消息丢失问题，可改为前端在 `onDone` 回调中调用独立 API 保存消息
