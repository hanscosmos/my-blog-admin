# 项目概况

本项目是个人博客后台管理系统（my-blog-admin），是一个前端项目。

- **客户端源代码**：同级目录 `my-blog-client`
- **后端服务源代码**：同级目录 `my-blog-service`
- **技术栈**：Vue 3 + TypeScript + Vite
- **包管理器**：npm
- **Node 版本**：20+

---

# 技术细节

## 自动导入（无需手动 import）

以下内容已配置自动导入，**在 `.vue` 文件和 `.ts` 文件中直接使用，无需 import**：

| 类别 | 自动导入内容 |
|------|-------------|
| Vue API | `ref`, `reactive`, `computed`, `watch`, `onMounted` 等所有 Vue 组合式 API |
| Vue Router | `useRoute`, `useRouter`（来自 `vue-router/auto`） |
| Element Plus | 所有 Element Plus 组件 |
| 自定义组件 | `src/components/` 下的组件可自动导入 |
| 工具方法 | `src/utils/tool/` 下的方法无需导入 |

## 样式

- 使用 **UnoCSS**（原子化 CSS），配置了 `@unocss/preset-uno`、`@unocss/preset-attributify`、`@unocss/preset-icons`
- 支持 **Less** 和 **Sass**

## 路径别名

- `@` → `src/` 目录

## 主要依赖

| 用途 | 库 |
|------|---|
| UI 组件库 | Element Plus |
| 状态管理 | Pinia + pinia-plugin-persistedstate |
| HTTP 请求 | Axios |
| 图表 | ECharts 6 |
| 日期处理 | dayjs |
| Markdown 编辑器 | @kangc/v-md-editor |
| 图标 | @icon-park/vue-next |
| 拖拽 | @atlaskit/pragmatic-drag-and-drop |
| 工具函数 | es-toolkit, @vueuse/core |
| 代码高亮 | Prism.js |

## 开发命令

- `npm run dev` — 启动开发服务器（端口 9999）
- `npm run build` — 构建生产版本
- `npm run build-check` — 类型检查 + 构建

## 代理配置

开发环境下 `/backapi` 路径代理到 `http://127.0.0.1:8000/`

---

# 要求

- **编写代码前**，先参考本文档了解项目配置和约定
- 如果有需要新增或修改后端接口的地方，**先询问我**，然后根据我的意见进行修改
- 遵循项目已有的代码风格和目录结构
- 使用 TypeScript，确保类型安全
- 使用 `<script setup lang="ts">` 语法
- 使用 Composition API
- 代码编写完之后不需要执行命令运行项目，因为项目一般来说都在运行着
