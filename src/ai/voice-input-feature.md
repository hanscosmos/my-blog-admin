# 语音录入功能开发方案

## 概述

为文章编辑页面实现语音录入功能，让用户可以通过语音输入来替代手动打字，识别结果可插入到 Markdown 编辑器中再进行修改。

---

## 现有架构

```
ReleaseArticle/index.vue
  ├── <input v-model="title">           ← 文章标题
  └── <app-md-editor ref="mdEditorRef">  ← Markdown 编辑器
        └── <v-md-editor v-model="text">  ← @kangc/v-md-editor v2.3.18
              └── .v-md-textarea-editor textarea  ← 实际 DOM textarea
```

- `AppMdEditor` 路径：[src/components/common/AppMdEditor/index.vue](../../src/components/common/AppMdEditor/index.vue)
- `v-md-editor` 插件配置：[src/plugins/v-md-editor/index.ts](../../src/plugins/v-md-editor/index.ts)
- `ReleaseArticle` 路径：[src/views/pages/Article/pages/ReleaseArticle/index.vue](../../src/views/pages/Article/pages/ReleaseArticle/index.vue)
- **当前暴露方法**：`getText()` / `setText()`（仅全量读写，无光标位置感知能力）
- **组件注册方式**：`unplugin-vue-components` 自动扫描注册

---

## 技术选型

### 语音识别：Web Speech API（浏览器内置）

- **API**：`window.SpeechRecognition` / `window.webkitSpeechRecognition`
- **优点**：零依赖、免费、Chrome/Edge/Safari 支持、中文识别效果好
- **限制**：需要 HTTPS 或 localhost 环境；Firefox 不支持

### 备选方案

- 阿里云一句话识别 / 实时语音转写（精度更高但引入 API Key 和费用）
- 讯飞语音转写 SDK

---

## 开发步骤

### 第一步：扩展 `AppMdEditor`，增加 `insertAtCursor` 方法

**文件**：[src/components/common/AppMdEditor/index.vue](../../src/components/common/AppMdEditor/index.vue)
**工作量**：约 0.5h
**优先级**：必须先做

底层 `v-md-editor` 本质上是一个 `<textarea>`，可以利用标准 DOM API 实现光标处插入。

**实现思路**：

1. 给 `<v-md-editor>` 添加 `ref="editorRef"` 模板引用
2. 通过 `editorRef.value.$el.querySelector('textarea')` 获取内部 textarea
3. 利用 `textarea.selectionStart` / `textarea.selectionEnd` 获取光标位置
4. 将文本切分为 `before + insertText + after`，更新 `text.value`
5. 用 `nextTick` 恢复光标位置到插入文本之后
6. 如果找不到 textarea（异常情况），fallback 为追加到末尾

**暴露接口变更**：

```ts
// 原来
defineExpose({ getText, setText });

// 改为
defineExpose({ getText, setText, insertAtCursor });
```

---

### 第二步：封装语音识别 Composable

**新文件**：`src/composables/useSpeechRecognition.ts`
**工作量**：约 2-3h

封装浏览器 Web Speech API 的全部状态和逻辑。

**核心状态**：

| 状态 | 类型 | 说明 |
|---|---|---|
| `isSupported` | `Ref<boolean>` | 浏览器是否支持 SpeechRecognition |
| `isListening` | `Ref<boolean>` | 是否正在聆听 |
| `isPaused` | `Ref<boolean>` | 是否暂停 |
| `interimText` | `Ref<string>` | 临时识别结果（实时显示用，非最终确认） |
| `finalText` | `Ref<string>` | 最终确认文本（累积） |
| `error` | `Ref<string \| null>` | 错误信息 |

**核心方法**：

| 方法 | 说明 |
|---|---|
| `start()` | 开始聆听，创建 SpeechRecognition 实例并启动 |
| `stop()` | 停止聆听，返回累积的最终文本 |
| `pause()` | 临时暂停识别（`recognition.stop()`，保留已识别文本） |
| `resume()` | 从暂停恢复（重新 `recognition.start()`） |
| `clear()` | 清空已识别文本（`finalText` 和 `interimText` 重置） |

**配置选项**：

```ts
interface SpeechOptions {
  lang: string;          // 识别语言，默认 'zh-CN'
  continuous: boolean;   // 连续识别，默认 true
  interimResults: boolean; // 临时结果，默认 true
  maxAlternatives: number; // 备选结果数量，默认 1
}
```

**关键实现细节**：

- `recognition.onresult`：遍历 `event.results`，区分 `isFinal` 和临时结果
- `recognition.onerror`：处理 `not-allowed`（权限拒绝）、`network`（网络错误）、`no-speech`（无语音）、`aborted`（主动停止）等错误类型
- `recognition.onend`：判断是否因静默超时自动结束，若是则更新状态
- Chrome 的连续模式下，不说话约 60 秒会自动停止，需要在 `onend` 中处理自动恢复逻辑

---

### 第三步：新建语音录入 UI 组件

**新文件**：`src/views/pages/Article/components/VoiceInputBar/index.vue`
**工作量**：约 3-4h

一个可复用的语音录入控制条组件。

**组件接口**：

```ts
// Props
interface Props {
  disabled?: boolean;        // 禁用状态
  placeholder?: string;      // 空状态提示文案
}

// Emits
interface Emits {
  (e: 'insert', text: string): void;  // 用户点击"插入到编辑器"
}
```

**UI 布局**：

```
┌─────────────────────────────────────────────────────────┐
│  🎤 点击开始录音    │  🔴 正在聆听...  [暂停] [停止]      │
│  ─────────────────────────────────────────────────────── │
│  临时识别内容预览（斜体灰色）                              │
│  "今天我们来聊聊前端开发..."                               │
│  ─────────────────────────────────────────────────────── │
│  已确认内容                                              │
│  "今天我们来聊聊前端开发的最佳实践。首先..."                 │
│  [插入到编辑器]  [清空]                                   │
└─────────────────────────────────────────────────────────┘
```

**交互状态机**：

```
idle ──点击麦克风──▶ listening ──点击暂停──▶ paused
  ▲                    │   │                    │
  │                    │   │                    │
  └──点击停止/插入──────┘   └──点击恢复──────────┘
                           (或自动超时)
```

**各状态 UI**：

| 状态 | 麦克风按钮 | 状态文字 | 可用操作 |
|---|---|---|---|
| `idle` | 灰色静态图标 | "点击开始录音" | 开始 |
| `listening` | 红色脉冲动画 | "正在聆听..." | 暂停、停止 |
| `paused` | 黄色闪烁 | "已暂停" | 继续、停止 |
| `error` | 灰色 + 红色感叹号 | 错误信息 | 重试 |
| `unsupported` | 不渲染整个组件 | — | — |

---

### 第四步：集成到 ReleaseArticle

**文件**：[src/views/pages/Article/pages/ReleaseArticle/index.vue](../../src/views/pages/Article/pages/ReleaseArticle/index.vue)
**工作量**：约 0.5h

在编辑器区域引入 `VoiceInputBar` 组件，响应 `@insert` 事件。

**交互流程**：

```
用户点击麦克风 → 开始聆听 → 实时显示临时文本
                              ↓
用户停止录音 → 最终文本显示在预览区 → 用户点击"插入到编辑器"
                              ↓ 或取消（清空）
                    mdEditorRef.insertAtCursor(text)
                              ↓
                    文本出现在编辑器光标位置，用户继续手动编辑
```

**布局方案**：将 `VoiceInputBar` 放在编辑器右下角，作为浮动面板（`absolute bottom-4 right-4`），不遮挡主要编辑区域。

---

### 第五步：边界情况与体验打磨

**工作量**：约 3-4h

| 场景 | 处理方式 |
|---|---|
| 浏览器不支持 SpeechRecognition | `isSupported` 为 `false` 时完全隐藏语音入口 |
| 用户拒绝麦克风权限 | 捕获 `not-allowed` 错误，Toast 提示 + 引导去浏览器设置 |
| 网络断开 | 捕获 `network` 错误，提示 Chrome 语音识别依赖网络 |
| 静默超时（~60s 没说话） | `onend` 中检测，自动切换到暂停状态，提示用户 |
| 移动端体验 | 移动端 Chrome 的 SpeechRecognition 在失焦时会停止，需在 `onend` 中做恢复处理 |
| HTTPS 环境 | 本地 localhost 自动可用；部署环境确认已是 HTTPS |
| 插入后光标位置 | 插入文本后光标移到插入内容末尾，编辑器保持焦点 |
| 长篇识别 | `finalText` 合理分段，避免一次性插入过长文本导致编辑器卡顿 |

---

## 文件结构总览

```
src/
├── composables/
│   └── useSpeechRecognition.ts          # 新增：语音识别逻辑封装
├── components/common/AppMdEditor/
│   └── index.vue                        # 修改：新增 insertAtCursor 方法
└── views/pages/Article/
    ├── components/
    │   └── VoiceInputBar/
    │       └── index.vue                # 新增：语音录入控制条组件
    └── pages/ReleaseArticle/
        └── index.vue                    # 修改：集成 VoiceInputBar
```

---

## 工作量汇总

| 步骤 | 内容 | 工作量 | 依赖 |
|---|---|---|---|
| 1 | `AppMdEditor` 扩展 `insertAtCursor` | 0.5h | 无 |
| 2 | `useSpeechRecognition` composable | 2-3h | 无 |
| 3 | `VoiceInputBar` UI 组件 | 3-4h | 步骤 2 |
| 4 | 集成到 ReleaseArticle | 0.5h | 步骤 1、3 |
| 5 | 边界情况 + 样式打磨 | 3-4h | 步骤 4 |
| **总计** | | **1.5-2 天** | |

---

## 待确认的设计决策

1. **识别后是直接插入编辑器，还是先进入二次编辑区**？
   - 方案 A：识别完直接插入光标位置（简洁，适合边说边改的流程）
   - 方案 B：先展示在语音面板的预览区，用户确认/编辑后再插入（更安全，适合大段语音录入）

2. **UI 定位方式**？
   - 方案 A：浮动按钮（点击展开控制面板），节省空间
   - 方案 B：固定在编辑器底部工具栏区域，始终可见

3. **是否需要语音指令**？
   - 例如说出"换行"自动插入换行符、"删除上一句"删除最后一句
   - 这会显著增加复杂度，建议先做 MVP 版本，后续迭代
