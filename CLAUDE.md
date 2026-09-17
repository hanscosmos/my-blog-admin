# 项目概况

本项目是个人博客后台管理系统（my-blog-admin），是一个前端项目。

- **客户端源代码**：同级目录 `my-blog-client`
- **后端服务源代码**：同级目录 `my-blog-service`
- **技术栈**：Vue 3 + TypeScript + Vite
- **包管理器**：npm
- **Node 版本**：20+

---

# 技术细节

## 路径别名

- `@` → `src/` 目录

## 主要依赖

| 用途            | 库                                  |
| --------------- | ----------------------------------- |
| UI 组件库       | Element Plus                        |
| 状态管理        | Pinia + pinia-plugin-persistedstate |
| HTTP 请求       | Axios                               |
| 图表            | ECharts 6                           |
| 日期处理        | dayjs                               |
| Markdown 编辑器 | @kangc/v-md-editor                  |
| 图标            | @icon-park/vue-next                 |
| 拖拽            | @atlaskit/pragmatic-drag-and-drop   |
| 工具函数        | es-toolkit, @vueuse/core            |
| 代码高亮        | Prism.js                            |

## 开发命令

- `npm run dev` — 启动开发服务器（端口 9999）
- `npm run build` — 构建生产版本
- `npm run build-check` — 类型检查 + 构建

## 代理配置

开发环境下 `/backapi` 路径代理到 `http://127.0.0.1:8000/`

---

# 项目参考文档

**如果用户让你参考文档（开发大型需求、进入不熟悉的功能模块、或改动前想了解页面/接口/坑点时），没有要求就不用阅读，先阅读 `docs/PROJECT_GUIDE.md`**（项目目录结构、各模块功能与字段、接口约定、通用组件、样式主题、已知占位与坑点清单）。它由一次通读整理而成，若代码演进与它不符，请同步更新该文档。

关键速查：

- 页面在 `src/views/pages/{Article,Auth,Resource,System,User,WorkBench}`，接口层在 `src/api/{article,authority,resource,system,user}`，一一对应
- 侧边栏菜单由**后端**返回（登录时拉取存 `store/menu`），菜单 `route` 字段 = 前端路由的 `name`
- 响应约定 `ResType{code,msg,data}`，成功 `code === 0`；分页返回 `{total, result}`；列表页统一 `useSearch`+`AppSearchPanel`，表单弹窗统一 `useDialog`
- 通用组件 `src/components/common/App*`、`src/utils/tool` 方法、Vue API、Element Plus 全部**自动导入免 import**
- AI 助手子系统在 `src/ai/`；个人事项/动态等重功能在 `User` 模块下

# Skills

根据用户请求的主要意图，自动选择对应 Skill：

- **Plan**：需求分析、技术方案、影响范围、实现思路 → `.claude/skills/plan/SKILL.md`
- **Code**：编写、修改、增加、删除代码 → `.claude/skills/code/SKILL.md`
- **Log**：生成变更日志、记录重大需求或技术改动 → `.claude/skills/log/SKILL.md`

使用 Skill 前读取对应的 `SKILL.md`，并遵循其中的规则。

## Routing Rules

- “先分析一下 / 怎么做 / 制定方案” → Plan
- “按照方案实现 / 帮我写 / 修改代码” → Code
- “记录一下 / 生成日志 / 更新变更记录” → Log
- 如果用户明确指定 Skill，优先按用户指定执行。
- 一个任务可以连续使用多个 Skill，例如：`Plan → Code → Log`。
- 如果已有明确且确认过的方案，可以跳过 Plan 直接使用 Code。
- 仅进行技术知识问答时，不需要调用这些 Skill。

# 要求

- **编写代码前**，先参考本文档了解项目配置和约定
- 如果有需要新增或修改后端接口的地方，**先询问我**，然后根据我的意见进行修改
- 遵循项目已有的代码风格和目录结构
- 使用 TypeScript，确保类型安全
- 使用 `<script setup lang="ts">` 语法
- 使用 Composition API
- 代码编写完之后不需要执行命令运行项目，因为项目一般来说都在运行着
- 后端涉及到迁移的时候保证迁移最小功能块，不要整个迁移
