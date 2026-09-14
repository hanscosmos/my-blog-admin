# my-blog-admin 项目结构与功能文档

> **用途**：本文件是项目的「一次检索、长期复用」参考文档，目的是让开发大型需求 / 进入不熟悉模块时无需重新扫读整个项目。
> **使用约定**：开发前先快速浏览「目录结构速览」与「跨模块约定」；进入具体模块前阅读对应模块章节；改动前用本文的「已知坑点」做自查。
> 本文件基于对当前仓库代码的通读整理，生成时间 2026-09-03。若代码演进与本文不符，请同步更新。

---

## 一、项目概况

个人博客后台管理系统（SPA），Vue 3 前端，与同级目录的 `my-blog-service`（后端，Django 风格）和 `my-blog-client`（博客前台）配合。

| 维度 | 内容 |
|---|---|
| 定位 | 博客内容与系统管理后台，登录后进入主布局 |
| 技术栈 | Vue 3.4（Composition API + `<script setup lang="ts">`）+ TypeScript + Vite 5 |
| 状态管理 | Pinia 2 + `pinia-plugin-persistedstate`（各 store 按 key 持久化到 localStorage/sessionStorage） |
| 路由 | Vue Router 4（history 模式），路由表**按模块拆分**，`/layout` 为唯一框架路由 |
| UI | Element Plus 2.10（全量注册 + 自动按需引入）+ UnoCSS（preset-uno / attributify） |
| 样式 | SCSS/Less + UnoCSS + CSS 变量主题体系（明暗模式 × 5 主题色） |
| HTTP | Axios 封装（baseURL `/backapi`，双 token 无感刷新，CSRF header，统一错误提示） |
| 包管理 | npm；Node 20+；开发端口 **9999** |
| 开发命令 | `npm run dev` / `npm run build` / `npm run build-check`（vue-tsc + build） |
| 代码规范 | ESLint 9 + Prettier（auto-import 产物 `.eslintrc-auto-import.json` 已启用） |

### 关键机制一览

- **后端菜单驱动侧边栏**：登录成功后调 `POST /authority/menu/tree/nav` 拉取菜单树写入 `useMenuStore`（持久化），侧边栏据此渲染。菜单 `route` 字段 = **vue-router 路由的 `name`**，跳转用 `router.push({ name: item.route })`，路由不存在时报「该路由尚未添加」。
- **路由守卫**（`src/router/index.ts`）：全局 `beforeEach` 依据 `useUserInfoStore().isLogin` 判断；登录态访问 `Login` 会被拦回；每次进入非隐藏页自动 `addTabItem` 加入多标签页。
- **多标签页 TabBar + keep-alive**：`layout/index.vue` 中 `keep-alive` 排除 `['ArticleDetail', 'UpdateArticle', 'Home']`（每次重进重挂载）。缓存开关由 `systemStore.isOpenStore` 控制。
- **响应约定**：后端统一 `ResType<T> = { code, msg, data }`，**`code === 0` 为成功**；非 0/非 401/非 501 会被拦截器自动 `ElMessage.error(msg)`。分页接口返回 `ResPageType<T> = { total, result }`，请求参数 `pageNumber` 从 1 开始。
- **鉴权**：请求头 `Authorization: {token}` + `X-CSRFToken`（cookie）。`code === 401` 时走单飞队列刷新（`POST /user/refresh`），失败/无 refreshToken 则清数据跳登录页。
- **权限体系（RBAC，查看 + 操作）**：菜单树 `type==='2'` 页面节点 = **查看权限**（决定侧边栏与路由可见性），`type==='3'` 按钮节点 = **操作权限**，其 `code` 即权限码，命名 `模块:资源:动作`（如 `article:delete`、`resource:icon-category:add`）。**`isNav=false` 的节点不上侧边栏**，用于顶部导航栏入口、系统设置、个人中心这类全局页面 —— 它们没有前端路由，可见性完全由 `code` 表达，前端用同一个 `hasPerm(code)` 判断。角色通过 `Role ↔ Menu` 多对多授权；超管角色 `code='10000'` 且 `isSuper=true`，绕过一切校验、不可编辑/删除/授权。登录时**前端**调 `GET /authority/permission/self` 写入 `usePermissionStore`（持久化 key `permission`），路由守卫与 `v-perm` 指令据此判断；**后端**由 `middleware/auth.py` + `config/permission.py` 的 `PERMISSION_PATH_MAP` 强制校验写接口（未映射路径默认放行，读权限由菜单可见性控制）。权限变更需重新登录才生效。
- **权限码来源**：后端 `get_user_permission_codes()` 收集所有 **非目录** 节点的 `code`，即 `type in ('2','3')` —— 页面节点带的是「能否看到该入口」，按钮节点带的是「能否执行该动作」，两类在前端都走 `hasPerm(code)`。后端 `has_permission()` 只认按钮码（`PERMISSION_PATH_MAP` 里登记的都是按钮码）。

---

## 二、目录结构速览（含功能定位）

```
my-blog-admin/
├── index.html                 # 入口 HTML（标题：博客后台管理系统）
├── vite.config.ts             # 插件(自动导入/组件注册/UnoCSS)、@ → src、代理 /backapi→127.0.0.1:8000
├── uno.config.ts              # UnoCSS：preset-uno + attributify；shortcut wh-full/xy-center；rule font-pingfang
├── tsconfig.json              # strict；paths @/* → src/*
├── auto-imports.d.ts / components.d.ts  # 自动导入产物（勿手改）
├── public/                    # 仅 vite.svg
├── docs/PROJECT_GUIDE.md      # 本文档
└── src/
    ├── main.ts                # 应用装配：Pinia(持久化) + ElementPlus(zh-cn) + IconPark + router + v-md-editor
    ├── App.vue                # 根组件：初始化主题模式 + 全局浮动 SysSettings 设置抽屉
    ├── ai/                    # ★ AI 助手子系统（独立子架构，见第八节）
    ├── api/                   # 接口层，目录结构与业务模块一一对应
    ├── assets/                # font(5 款自定义字体) / image(cover.webp、draft.jpg) / svg/waves(5 色波浪)
    ├── components/            # 全局自动导入组件
    │   ├── common/            #   App* 通用组件（对话框/分页/搜索面板/上传/图表/MD编辑器/标签/空态/图标/无限列表/TOC/按钮）
    │   │   └── Upload/        #   AppAutoUpload(空壳)、AppImageAutoUpload、AppAvatarUpload/Cropper
    │   ├── SelectIcon/        #   图标选择器（菜单图标用，已实现）
    │   └── SelectImage/       #   图片选择器（空占位，未使用）
    ├── config/                # 全局配置：dict.ts(字典分类树，前端硬编码)、module.ts、mock.ts(菜单 mock)、index.ts(MAX_IMAGE_SIZE=10)
    ├── directives/            # 全局指令：permission.ts（v-perm，无权限时 display:none）
    ├── hooks/                 # 组合式函数：useDialog/useSearch/useDict/useMenu/useScroll/useTaskReminder/useSpeechRecognition/usePermission
    ├── layout/                # 主框架布局
    │   ├── index.vue          #   侧栏 + 顶栏 + 标签页 + 内容(keep-alive)
    │   └── components/        #   SideBar(+FoldBtn)/TopBar(TodoListBtn·MessageBtn·ArticleBtn·UserInfo·AiChatWidget)/TabBar
    ├── plugins/               # iconpark（全量注册）、v-md-editor（编辑器+预览全局组件与插件）
    ├── router/
    │   ├── index.ts           # 路由创建 + 登录守卫 + 自动加标签
    │   └── modules/           # 按业务拆：WorkBench/Auth/Resource/Article/System/User
    ├── store/                 # Pinia：user(登录态)/system(明暗+主题+侧栏)/menu(后端菜单树)/tab(tabList 多标签)/permission(权限码)
    ├── style/                 # reset + common 工具类 + UIFramework + syscolors(mode/theme CSS 变量) + 字体注册
    ├── types/                 # global.d.ts(全局 ResType/PageType/ResPageType 等)、type.ts(FormDialogProps/TabItem)、sys/enum、user(动态类型)
    ├── utils/
    │   ├── request/           #   Axios 封装（base、other 两种实例；401 刷新队列）
    │   ├── tool/              #   ★ 模板内免 import 的工具（见下）
    │   ├── storage/           #   session/localStorage 包装（含带时效版本）
    │   ├── eventBus/          #   mitt 事件总线（task:refresh/update/copy、user:stats-refresh）
    │   └── validate/          #   FormValidate 表单校验工厂
    └── views/
        ├── components/        # 全局自动导入的视图组件：Charts(BaseBarLineChart 等)、TabPage、SysSettings
        └── pages/             # 业务页面，见「功能模块」章节
```

### 各目录要点

| 目录 | 内容与约定 |
|---|---|
| `api/` | 每个子目录 = `index.ts`（函数）+ `type.ts`（类型）。导出形如 `getXxxListApi`，函数内 `request.post<ResType<T>>('/xxx', data)`。文章/权限/资源/系统/用户各自独立子目录 |
| `hooks/` | `useSearch` 统一分页/搜索/滚动加载；`useDialog` 统一表单弹窗（`visible/optType/row`）；`useDict(code)` 拉字典项；`useMenu` 刷新后端菜单 |
| `store/user` | `userInfo/token/refreshToken/csrfToken/isLogin/userId`，persist key `user`；个人中心改资料会回写这里 |
| `store/system` | `mode('light'|'dark',默认 dark)/theme(5色,默认 green)/isSideExpand/isOpenStore`，persist key `system`；`changeTheme/changeMode` 通过给 `<html>` 增删 class 实现 |
| `store/tab/tabList` | 多标签页列表，persist key `tabList`（sessionStorage） |
| `store/menu` | 后端菜单树 `menuTreeList`，persist key `menu`（localStorage），登录/菜单增删改后刷新 |
| `store/permission` | 权限码集合 `permCodes` + `isSuper/roles/menuRoutes`，persist key `permission`（localStorage）；`hasPerm(code\|code[])`、`clearPermission()`（退出登录时调） |
| `hooks/usePermission` | `loadPermission()` 拉 `permission/self`、`ensurePermission()` 已有则跳过（路由守卫用）、`canAccessRoute(name)` 判断路由是否可访问 |
| `utils/tool` | 被 `unplugin-auto-import` 扫描且 `vueTemplate:true` → **`.vue` 模板/脚本与 `.ts` 中直接可用免 import**：`fmtTime/dateDiff/getTagColor/toRgba/copyClick/confirmHandler/getCookie/setCookie/randomColor/getColorPair/getImg/getSvg/uploadFile/getDictLabelByKey` 等 |
| `types/global.d.ts` | 无 export 的**全局类型**（免 import）：`PageType/ResType/ResPageType/ReqPageType/IdType/IdsType/DictType/TableColumnType` |
| `views/components` | `TabPage`（页面内容容器）、`Charts/*`、`SysSettings` 均为**全局自动导入**组件（unplugin-vue-components 的 dirs 含此目录） |

---

## 三、样式体系与主题（重要，写页面必须遵守）

- 入口引入链：`main.ts → style/index.css → common/reset.css → common/index.scss → UIFramework/index.scss(含 md-editor.scss) → syscolors/index.css`。
- **CSS 变量两套前缀**：
  - `--sys-*`：随**明暗模式**切换（`syscolors/mode/{dark,light}.css`）。如 `--sys-bg-color`、`--sys-box-bg-color`、`--sys-wrapper-bg-color`、`--sys-text-color`、`--sys-text-secondary-color`、`--sys-border-color`。**注意是 `--sys-text-secondary-color`，不是 `...-color-secondary`**。
  - `--theme-*`：随**主题色**切换（`syscolors/theme/{blue,green,pink,purple,red}.css`）。`--theme-color`（主色）/`--theme-hover`/`--theme-card-bg`/`--theme-bg`。
- 主题切换：store 给 `<html>` 增删 `{mode}` 和 `{theme}` 两个 class（如 `html.dark.green`）；JS 侧通过 `systemStore.systemColor` 取主题 hex（默认 green `#43a047`）。
- Element Plus 主色桥接在 `UIFramework/index.scss`（`--el-color-primary: var(--theme-color)`），圆角统一 2px。
- **新增页面配色**：背景/文字/边框一律用 `--sys-*`，强调色用 `--theme-*`，禁止硬编码颜色。`common/index.scss` 已提供 `wrapper-item / deep-wrapper-item / active-item / hover-wrapper / wrapper-filter-item / border-*` 等语义化工具类，优先复用。
- UnoCSS：全局 `wh-full`、`xy-center`、`font-pingfang`；可用 attributify 与 variant-group 写法。
- 字体：`@font-face` 注册于 `style/index.css`；`.font-title`（优设标题黑）用于标题/大数字，`.font-beauty`（roboto）。
- 主题波浪 SVG（登录页背景）按主题动态取 `assets/svg/waves/{theme}.svg`。

---

## 四、通用组件（src/components/common/，全局自动导入，模板直接 `<AppXxx>` 使用）

| 组件 | 作用 | 备注 |
|---|---|---|
| `AppDialog` | el-dialog 封装，`title/visible/width/hideFooter`，emit `confirm/close`，具名插槽 header/footer | 所有业务表单弹窗基座 |
| `AppSearchPanel` | 列表页骨架：`header`(搜索)/默认(列表)/`footer`(分页) 三插槽 + loading + 空态 | 与 `useSearch` 配套，绝大多数列表页结构 |
| `AppPagination` | el-pagination 封装，emit `pageChange({pageNumber,pageSize})` | 尺寸 `[10,20,30,50]` |
| `AppDialog`/`AppButton` | 按钮封装：`type=default|plain|text` | — |
| `AppTag` | 彩色标签（chroma 半透明底），`name/color/opacity/size/round` | 颜色缺省取 `systemColor`；业务常见「按字典色渲染状态」 |
| `AppIcon` | icon-park 图标封装 `name/theme/size/color` | 全项目最常用 |
| `AppEmptyData` | 空数据占位 `desc/size` | AppSearchPanel 内部使用 |
| `AppEcharts` | ECharts 容器封装 `option/isResponsive`，自动适配明暗背景 + resize | `defineExpose({getDom,setOption,repaint})` |
| `AppMdEditor` | v-md-editor 封装，`getText/setText/insertAtCursor`，`@save`(Ctrl+S)/`update:modelValue`，正文图片上传 type=`article` | 编辑器插件注册见 plugins/v-md-editor |
| `AppInfiniteList` | 无限滚动列表（底部锚点 + IntersectionObserver），emit `loadMore` | 目前仅用户动态使用 |
| `AppArticleToc` | 文章目录（从容器内 h1~h6 生成，滚动高亮） | 仅文章详情页使用 |
| `Upload/AppImageAutoUpload` | 图片/文件上传（el-upload 自定义 http-request）。props `editable/type/desc/defaultUrl/accept/beforeUpload/onUpload`，emit `uploadSuccess(url,fileName)`。**`type` 决定后端存储目录**（如 `icon/image/article/article-cover/article-column-cover/avatar/resume/mood`） | 默认走 `uploadFile`，默认体积限制 `MAX_IMAGE_SIZE=10`M |
| `Upload/AppAvatarUpload` + `AppAvatarCropper` | 头像：选文件→cropperjs 裁剪(200×200, jpeg0.9)→上传 type=`avatar` | 仅个人资料用 |
| `Upload/AppAutoUpload` | **空壳占位组件，无实现**，勿使用 | 用 `AppImageAutoUpload` |
| `SelectIcon` | 图标选择器（弹层搜索+网格+分页，左侧可直接上传新图标），emit `confirm(item|null)` | 被菜单表单「选图标」使用；`MenuFormDrawer` 只取 `item.url` 存 `menu.icon` |
| `SelectImage` | **空占位，无实现、未使用** | — |

> 说明：自动导入目录是 `src/components` 与 `src/views/components`；**业务页 `views/pages/**` 下的兄弟/局部组件不自动导入，需显式 import**（例如各页面的子组件）。

---

## 五、请求层与接口约定

- 封装：`src/utils/request/index.ts`。`request` = `new Request('base')`，`get/post/put/delete` 返回 `ResType<T>`（已剥到 `res.data`）。
- baseURL `/backapi`；开发代理 → `http://127.0.0.1:8000/`（见 vite.config.ts）。
- 拦截器：请求注入 `Authorization: token` 与 `X-CSRFToken`（读 cookie `csrftoken`）；响应 `code===401` → 队列化刷新，`/user/login`、`/user/refresh`、已重试请求或缺少 refreshToken 时直接清空跳登录；`code===501` 仅 console；其它非 0 code 自动 `ElMessage.error`。
- 登录接口集中在 `src/api/index.ts`：`loginApi`（MD5 密码 + key + 图形验证码文本）、`refreshTokenApi`、`getValidCodeApi`、`uploadFileApi`（`POST /sys/file/upload`，FormData `file/name/nanoid+原名/type`）。
- **接口前缀约定**：文章 `/article*`、权限 `/authority*`、资源 `/resource*`（图标实际见 `/resource/icon|image`，分类接口方法 GET/POST 不一）、系统 `/sys*`、用户 `/user*`、博主档案 `/blogger*`、AI `/ai*`。
- **成功判断不一致（已知问题）**：多数页面用 `if (data)` 判断 boolean，部分组件（BloggerProfile、DistributeAuthorityDialog、ArticleFormDrawer 部分）用 `res.code === 0`。新代码建议统一 `code === 0`。

---

## 六、布局与顶层交互

| 组件 | 职责与要点 |
|---|---|
| `layout/index.vue` | 三明治布局：SideBar(宽度 14rem/4rem 随 `isSideExpand`) + TopBar(4rem) + TabBar(条件显示) + 内容。`keep-alive` 排除 `ArticleDetail/UpdateArticle/Home`；`route.meta.hideSide/hideTab/hideSide` 控制局部隐藏 |
| `SideBar` | `el-menu` 渲染 `menuStore.menuTreeList`；`item.type==='1'` 渲染 `el-sub-menu`(目录)，否则叶子。图标是后端图片 URL（`<img>`）。顶部「博客后台」点击回 Home；`FoldBtn` 切换 `isSideExpand`。跳转 `router.push({name:item.route})`，路由不存在 → warning |
| `TabBar/TabItem` | 多标签：`TransitionGroup` 横排、`useScroll` 左右箭头；Home 标签固定不可关。左键切换、关闭图标、**右键菜单**(关当前/左/右/其他/刷新)、**拖拽排序**(pragmatic-drag-and-drop，Home 除外)。持久化 sessionStorage `tabList` |
| `TopBar` | 右侧按钮依次：`TodoListBtn`（待办角标+下拉，见用户中心）→ `MessageBtn`(**占位无逻辑**) → `ArticleBtn`（跳 `ReleaseArticle`）→ `UserInfo`(个人中心/退出登录下拉) → `AiChatWidget`(AI 助手悬浮面板) |
| `SysSettings` | `App.vue` 全局挂载，左下角圆形按钮打开抽屉：开关 keep-alive(`isOpenStore`)、显示/隐藏标签页(`tabVisible`)、浅色/深色、5 主题色。纯前端，无接口 |

---

## 七、功能模块

### 0. 首页 / 工作台（`views/pages/WorkBench/Home/`）

入口路由 `Home`（`/`）。页面堆叠：`HomeOverview`（欢迎语+今年/本月/本周进度%+发文/草稿数，取 `POST /sys/self/stat`）→ `StatKPIBar`（文章/草稿/用户三 KPI + 较上月 diff，取 `POST /sys/stat` type 为 `article/drafts/user`）→ `ArticlePublishStat`（`POST /article/publish/trend`）→ `RecentUserTask`（`POST /user/task/recent/list`，时间线，分数按 `getColorPair` 上色，查看更多跳 UserCenter）+ `HotArticle`（`POST /article/hot`，点击跳 ArticleDetail）→ `UserTaskScoreStat`（`POST /user/task/score/stat`）。

- 图表统一用 `views/components/Charts/BaseBarLineChart.vue`（props `title/getDataFn/xDataKey/yDataKey/unit/chartType/showToggle`，内部 week/month/year/custom 时间范围切换、明暗自适应、渐变配色）；`BaseBarChart/BaseLineChart` 只是 `chartType` 固定封装。
- **StatEnum 坑**：`types/sys/enum.ts` 里 `UserTask = 'column'`，`column` 实际指个人事项统计口径，勿被命名误导。
- 注释掉/未启用：`StatCard`（统计卡）、`ActiveUser`（活跃用户）在 `Home/index.vue` 被注释；`ActiveUser.vue` 是空实现。首页 keep-alive 排除，重进重拉。

### 1. 文章管理（`views/pages/Article/`，api `api/article/**`，路由见 `router/modules/Article`）

| 页面 | 说明 |
|---|---|
| `pages/ArticleList` | 文章列表：列表/卡片双视图（`ArticleCard`）；仅按标题关键词 + 文章类别（树形单选）筛选；作者本人(列表行 `authorId===userId`)才见编辑/删除，「查看详情」仅 `status==='publish'`。后端 `author/category` 实为对象，用 computed `articleList` 拍平 |
| `pages/ArticleDetail` | 只读详情：`route.query.id` → `POST /article/detail`（返回 `any`），v-md-preview 渲染正文 + `AppArticleToc` 目录 |
| `pages/ReleaseArticle` | **新建与编辑共用一个组件**（`route.name==='UpdateArticle'` 区分，用 name 不用 path）。流程：标题+正文(≥10字)页面级校验 → 打开 `ArticleFormDrawer` 抽屉填分类/标签(≤4)/专栏/原创/可见性/封面/摘要 → 发布(`status=publish` 抽屉内强校验) 或 存草稿(不校验)。提交字段 = title + pinyin(`pinyin-pro` 前端生成) + content + category + cover + tags[] + abstract + status + visible + properties + column。新建成功 `router.push UpdateArticle?id=res.data`。**keep-alive 缓存 ReleaseArticle → 新建切 tab 回来内容可能残留；`onBeforeUnmount` 的 `articleEditorStore.reset()` 在 keep-alive 下不触发** |
| `pages/ArticleCategory` | 树形表格、无分页、可加子分类；**删除按钮未接线** |
| `pages/ArticleTag` | 分页列表 + 名称搜索 + 颜色列(字典 `ARTICLE_TAG_COLOR`)；**删除按钮未接线** |
| `pages/ArticleColumn` | 分页 + 封面列；删除已接线(`deleteArticleColumnApi({ids})`) |
| `hooks/useArticle.ts` | 提供分类树/标签/专栏三个查询 hook（分类树在此格式化 createTime；与各 service.ts 的 `fmtResData` 重复冗余） |
| `components/ArticleFormDrawer` | 抽屉：分类树选、标签多选、专栏单选、properties/visible 字典、封面 `AppImageAutoUpload type=article-cover`、摘要(≤100) |
| `components/VoiceInputBar` | 语音录入悬浮条（收起=麦克风按钮，展开=识别面板），`insertAtCursor` 插入正文。见 hooks/useSpeechRecognition |

文章状态流转：字典 `ARTICLE_STATUS`（`draft`草稿/`publish`正文）；`ArticleFormDrawer` 用 `statusList[0]/[1]` **下标假设**，依赖字典返回顺序，有风险。

实体字段（api/article/type.ts）：`ArticleFormType{title,pinyin,category,content,properties(原创),visible,column?,cover?,abstract}`；`ArticleQueryType{title,category?,tags?,visible?,column?,isTop?}`。**`status/tags` 实际通过页面级 `OriginArticleFormTpe`(views/pages/Article/types) 合并提交，不在 Form 类型里**；置顶/阅读量在 admin 侧基本未体现。

### 2. 权限管理（`views/pages/Auth/`，api `api/authority/**`）

| 页面 | 说明 |
|---|---|
| `Menu` 菜单管理 | 树形表格(后端 `GET /authority/menu/tree/all`)，可新增/新增子菜单/编辑/删除（删除会级联清掉 `MenuAuthority`）。`MenuFormDrawer` 抽屉维护字段：`name/route(路由 name)/icon/color/code(权限码)/sort/father/type/isNav`。**`type` 由父节点推导、不可手选**：`'1'` 目录（侧边栏可折叠项）、`'2'` 页面（可点击跳转，必须有 `route`）、`'3'` 按钮（权限码载体，无 route/图标/颜色，必填 `code`）。按钮节点会自动隐藏 route/颜色/图标。**`isNav`（侧边栏显示开关）**只对目录/页面可见：关掉后该节点不下发到侧边栏，用于顶部导航栏入口、系统设置、个人中心这类全局页面；此时页面节点的 `route` 允许留空（非路由页面，可见性靠 `code`）。新建子节点默认继承父节点的 `isNav`。表格「侧边栏」列显示 显示/隐藏。保存后需同时刷新菜单树 + `getNavMenuTreeList()` 双刷 |
| `Role` 角色管理 | 无分页列表，字段 `name/code/sort/limit(人数上限)/isSuper`；编辑/删除/权限分配均已接线。`isSuper` 行（角色码 `10000`）三个操作按钮全部禁用并带 title 提示。 |

**角色授权 `DistributeAuthorityDialog`**：单棵 `el-tree` 勾选树，数据源 `GET /authority/menu/tree/all`。树上每个节点带类型标签，权限语义是：

| 节点 `type` | 标签 | 含义 |
|---|---|---|
| `'1'` | 目录 | 仅容器，勾了才能让子页面挂上侧边栏 |
| `'2'` | **查看** | **该角色能否看到并进入此页面**（= 读权限） |
| `'2'` 且 `isNav=false` | **全局** | 不上侧边栏的入口（顶部导航栏、系统设置、个人中心），勾上该角色才看得见 |
| `'3'` | 操作 | 页面内可执行的动作，`code` 即操作权限码 |

「全局」子树由迁移 `0009_seed_menu_tree` 种下，结构是 `全局`(目录) → 各入口(页面节点) → 个人中心下的具体操作(按钮节点)。页面节点自带 `code`（如 `global:setting:open`、`user:center`），前端直接用 `v-perm` 引用；`个人中心` 下的按钮走 `user:*` 码，`创作` tab 的文章增改删复用文章管理已有的 `article:add/update/delete`。这些节点**种子只建不授权**，需要在角色管理里手动分配。

- **必须用 `:check-strictly="true"`（关掉父子联动），否则「仅查看」根本配不出来。** 开启联动时 el-tree 会用子节点状态反推父节点——`node.mjs` 的 `reInitChecked()` 在「子节点全部未勾选」时会把父节点置为未勾选，于是取消最后一个操作必然连带取消「查看」。关掉联动后，「查看」只由页面/目录节点自身的勾选决定，与操作互不影响。
- 联动没了要自己补两条规则（`onCheck`，`@check` 事件只在用户点击时触发，程序化 `setChecked*` 不触发，所以回显/全选不会误触发）：
  - **勾选时补祖先**（`checkAncestors`）——侧边栏树需要父级才能挂载；
  - **取消时清子孙**（`clearDescendants`）——页面不可见时其操作权限无意义。
  - 两条规则都**不向上取消**：取消一个页面不会连带取消它的目录，这是刻意的（单页取消不该动到同目录下的其他页面）。
- **回显**：`getMenuListByRoleIdApi` 返回 `{menuIds: string[]}`，`setCheckedKeys` 前先 `await nextTick()`（避免设在旧节点实例上），并用 `withAncestors` 补齐祖先（历史数据可能存在「只授权了按钮、没授权其页面」的记录）。严格模式下勾选集合就是最终集合，不会再被推导改写。
- 提交 `setRoleMenuApi({roleId, menuIds})`，`menuIds = getCheckedKeys()`（严格模式没有半选状态）。后端 `set_role_menu` 是 `transaction.atomic()`，并拒绝向 `isSuper` 角色授权。
- 对话框顶部有「全选 / 清空」，因为严格模式下勾全量需要逐个点。
- 已知边界：「不允许查看」目前只由**前端**保证（侧边栏不下发 + 路由守卫拦截 + `v-perm` 隐藏）。读接口不在 `PERMISSION_PATH_MAP` 里，绕过前端直接调 `xxx/list` 仍能拿到数据；需要服务端也挡读时，在映射表里补 `xxx/list → 对应页面权限码` 即可。

**权限码与按钮节点的关系**：一个页面的操作权限 = 该页面菜单（`type='2'`）下挂的 `type='3'` 子节点。新增后端写接口时必须同步在 `config/permission.py` 的 `PERMISSION_PATH_MAP` 里登记「路径 → 权限码」，否则该接口**默认放行**。

**菜单数据的来源**（后端 `my-blog-service`）：`sys_menu` 全量结构由 `modules/authority/migrations/0009_seed_menu_tree.py` 维护 —— 按 `code` 做 `get_or_create`，幂等且不覆盖界面上改过的字段，也**不写 `MenuAuthority`**（授权始终由角色管理维护）。新增节点优先在「菜单管理」界面里加；需要固化到代码（换环境可重建）时，往该迁移的 `MENU_TREE` 里补一条。回滚为空操作，删节点会连带清掉授权记录。
   - 新增 authority 迁移时**编号要从 0008 往后接**：0002~0007 已在数据库的 `django_migrations` 里注册，而对应文件只在开发机上（`migrations/` 被 `.gitignore` 忽略），编号撞车会在两边合并时出问题。

### 3. 资源管理（`views/pages/Resource/`，api `api/resource/**`）

`Icon` 与 `Image` 是**同一模板复制的同构模块**（后续扩展资源类型照抄）。

| 页面 | 说明 |
|---|---|
| `Icon/index.vue` = tabs：`IconLib`(图标库) / `IconCategory`(分类) | 库：搜索 + 分类横向 tab(前端手塞 `id:''`「全部」假项) + 列表/卡片视图切换(IconCardItem) + `useSearch(pageSize=50)`；新增走 `IconFormDialog`（`AppImageAutoUpload type="icon"`，`source` 自由文本默认 iconpark）。分类：无分页表格 + `IconCategoryDialog`，**删除未接线** |
| `Image/index.vue` 同构 | 库：搜索+分类 tab+CSS Grid 卡片(ImageCardItem 自带编辑/删除按钮) + `useSearch(默认10)`；新增表单多一个「上传/填URL链接」radio；`type="image"`。分类与 Icon 一致 |

资源分类共用类型 `api/resource/type.ts`（`CategoryFormType{name,value,sort}`）。图标实体多 `source` 字段，图片无。上传统一走 `uploadFile`，靠 `type` 参数分目录。
坑：`getIconCategoryListApi` 是 **GET**、`getImageCategoryListApi` 是 **POST**（不一致）；「全部」假项别误传给表单分类下拉。

**图片批量上传**（`ImageBatchDialog.vue`，入口在 `ImageLib` 头部「新建图片」右侧）：

- 弹窗内先选**图片类型**（本批统一使用该类型），再选图；**未选类型时选图区禁用**（`.upload-disabled` 样式 + handler 内兜底提示），确定前也会再校验一次。
- 一次多选图片 → 并发 `uploadFile(..., 'image')` 拿到 url → 预览确认后一次提交 `addImageBatchApi`（`/resource/image/batch/add`）。**上传与入库分离**：文件先传、点「确定」才落库，取消不留脏数据；类型在确定时才读取，中途改类型对本批全部生效。
- 其余字段自动填充：`name` = 文件名去扩展名后**截断到 15 字符**、`sort` = 0、`desc` = ''。前端截断长度常量 `NAME_MAX` 必须与后端 `service/image.py` 的 `BATCH_NAME_MAX` 一致。
- 重名（批内/库内）与长度不符的条目由后端 `validate_batch_add_image_params` **逐条跳过**，其余正常入库；返回 `{total, success, skipList}`，前端汇总提示。全部被跳过时返回 501，走 axios 拦截器提示。
- 预览里对「截断后批内同名会被跳过的那些」打橙色标记（前端预判，后端跳过为准）；缩略图用 `URL.createObjectURL`，需在移除/关闭/卸载时 `revokeObjectURL` 释放。
- 无图片分类时弹窗内提示去创建（入口按钮不置灰，因为 `AppButton` 无 `disabled` 属性，见坑点清单）。后端新接口必须在 `config/permission.py` 登记，否则未登记路径默认放行。

### 4. 系统管理（`views/pages/System/`，api `api/system/**`）

| 页面 | 说明 |
|---|---|
| `Dictionary` 字典管理 | 左 `el-collapse` 分类树（**前端硬编码在 `src/config/dict.ts`**，无法页面新建分类）+ 右 `el-table` 字典项。字段 `code(所属字典码)/key(存储枚举值)/value(中文展示)/sort/desc/status(表格 switch)`。新增/编辑走 `DictDialog`（code 由当前选中叶子赋值、disabled）。两个列表接口：`getDictListApi`(含禁用，管理页用) 与 `getAvailableDictListApi`(仅启用，业务 `useDict` 用)，勿混用 |
| `UpdateLog` 更新日志 | 分页 + keyword；字段 `summary/version/plannedReleaseDate(计划)/actualReleaseDate(实际)/details(Markdown)/releasedType(字典)/status(字典)/isCurrentVersion`；表单 add/edit/view 三态弹窗，view 全 disabled。**`deleteUpdateLogApi` 已定义但页面无删除按钮** |
| `Users` 用户管理 | 分页，筛选 keyword + roleId(下拉取 role list)。列：头像昵称 / 邮箱(`row.profile.email`) / 角色标签 / 创建时间。新增 `AddUserDialog`(username/nickName/email/roleIds)；edit 模式仅可改角色，调 `setUserRoleApi`。**重置密码按钮无点击无 API；无删除用户、无头像上传**。`UserItemType.profile` 是 `any`，顶层 email 与 profile.email 混用 |
| `BloggerProfile` 博主档案 | 给**博客前台展示的博主信息**做配置（admin 只存，前台另行消费）。`el-tabs` 四块：基本介绍(`IntroductionEdit` Markdown，AppMdEditor+`@save`)、联系方式(`ContactEdit` phone/wechat/qq/github/weibo/site，`defineExpose({getForm})`)、资产信息(`AssetsEdit` 可编辑表格 items[{label,value}])、简历(`ResumeEdit`，AppImageAutoUpload `accept=".pdf"` type=`resume` ≤5MB)。**任一 tab 保存都会把整份档案 `updateBloggerProfileApi(form)` 全量提交** |

`api/system/sys`：是**数据统计接口**，与主题设置无关——`getSysStatApi({type,rangeType})→POST /sys/stat`、`getSelfStatApi()→POST /sys/self/stat`（首页用）。

字典约定（贯穿全局）：**`key`=后端枚举码、`value`=中文**。转换用 `useDict` 的 `getValueByKey(arr,key)` 或 utils/tool 的 `getDictLabelByKey`。`useDict` **无缓存**，每次 getDictDataList 都发请求。

### 5. 用户中心（`views/pages/User/`，api `api/user/**`）

- **入口**：`UserCenter`(`/user-profile`) 一个路由；个人中心 `Profile/index.vue` 是**单页内 `<component :is>` tab 切换**（动态/创作/事项），非内嵌路由。`?tab=task|dynamic|article` 可指定初始 tab（外部跳任务页统一用 `/user-profile?tab=task`）。子组件通过 `provide/inject('updateTabCount')` 上报数量；整体统计走 `POST /user/stats`，事件 `user:stats-refresh` 触发刷新。改资料后回写 `useUserInfoStore` 保证顶栏一致。
- **个人资料 `UserProFileForm`**（el-drawer）：头像(AppAvatarUpload 裁剪 200×200, type=`avatar`)、昵称(2-10 必填)、性别、邮箱、签名 talks、背景封面(AppImageAutoUpload type=`avatar` 不裁剪)。`birthday` 字段在类型中定义但**表单未实现**。保存 `updateUserProfileApi`。
- **心情 `UserMoodPanel`**（独立 `sys_user_mood` 表，与静态签名 talks 语义分离）：发文字+emoji 表情(8 个)+图片(多选 type=`mood`)，「文字和图片至少一个」；发布后事件刷新计数（后端记 create_mood 动态）。历史滚动加载(`useSearch isScroll`)；hover 删除。
- **用户动态 `Activity`**：时间线无限滚动(`AppInfiniteList` + useSearch pageSize=20 isScroll)。类型映射 `activityMetaMap` 覆盖 7 种 action：`publish_article/create_draft/update_article/delete_article/create_task/complete_task/create_mood`。文章类渲染卡片并跳 ArticleDetail(正文)/UpdateArticle(草稿)；被删文章显示「已删除《》」。类型定义 `IActivityItem` 在 `types/user/index.ts`（**注意不是 UserInfoType**）。
- **我的创作 `User/Article`**：个人文章列表，行组件 `ArticleListItem`，分页。

**我的任务（个人事项，功能最重的模块）** —— `User/Task/index.vue` 内 `el-segmented` 三视图：
- `pages/TaskDashboard` 面板：按状态 `todo/pending/done/aborted` 分列，取 `getUserTaskPanelListApi({startTime,endTime})`，窗口「今天±2 天」；卡片纯展示。
- `pages/TaskList` 列表：卡片网格 + 搜索(关键字/状态/更多筛选:优先级·截止范围) + 本页全选 + 批量删除 + 标签云 `UserTaskTagCloud`（`getUserTaskTagListApi` name/count，点击筛选再次点击取消；颜色用全局 `getTagColor`）。
- `pages/TaskTable` 表格：el-table `row-key=id reserve-selection`，`sortable=custom`(sortOrder)，默认 endTime 降序；操作 编辑/复制/删除。
- 批量选择 hook `useTaskBatchSelect`（Set<id>，翻页不丢，配合 reserve-selection）。
- 增删改：`UserTaskFormDialog`（`optType=add/copy→addUserTaskApi`，`edit→editUserTaskApi`）；**复制必须剥离 id/score/时间（否则 ID 重复）**，复制默认全量预填不重置状态。字段：`title/tags[]/description/priority/status/deadline/startTime/endTime/importance/urgency/growth/happiness/negative/remindBeforeMinutes`。评分默认 `3/3/3/3/0`（曾因默认 0 与后端不一致导致得分错误）。done 时提醒下拉禁用置 -1 且**必须填 start/endTime**；空标签后端 split 需过滤空串；tags 必填校验需 `type:'array' as const`。
- 数据字典：`USER_TASK_STATUS`、`USER_TASK_PRIORITY`（经 provide 下发子组件）。
- 提醒 `useTaskReminder`：60s 轮询 `getUserTaskRemindListApi`，范围=已逾期 + 未来 24h；`TodoListBtn` 角标+下拉展示；`remindBeforeMinutes>=0` 到点 `ElNotification`（localStorage `task-remind:{id}:{trigger}` 去重，每任务一次，点击跳任务页）。**纯前端提醒，仅页面打开时生效**。
- 得分：后端算 `score`，卡片/表格「得分」列 `Math.round(x*10)/10` 展示，正分红负分绿（注：值为分时习惯色语义反向）。

用户中心 API 一览（api/user/index.ts + api/user/task/index.ts）：
`/user/get/self`、`/user/update/self`、`/user/stats`、`/user/activity/list`、`/user/article/list`、`/user/mood/list|add|delete`；`/user/task/add|update|delete|list|panel/list|tag/list|recent/list|remind/list|score/stat`。博主档案 `/blogger/profile/get|update`。

### 6. 登录 / 全局

- `views/pages/Global/Login`：用户名+密码(MD5 加密)+图形验证码（AppTag 点击刷新，验证码文本来自 `getValidCodeApi`）。登录成功：写 user store(token/refreshToken/csrfToken，csrf 写 cookie) → `getNavMenuTreeList()` 拉菜单 → 跳 `/`。有「游客一键登录」按钮占位。
- `views/pages/Global/Error`：空壳页面，无实现。

---

## 八、AI 助手子系统（`src/ai/`，自成体系）

> 前端只做聊天 UI 与状态，模型调用由**后端 my-blog-service 代理**（OpenAI 兼容接口 / DeepSeek，密钥在后端）。前端 `AiProviderConfig.apiKey/baseUrl` 留空。

- **入口**：`AiChatWidget` 挂在 `TopBar` 右侧（**不要按旧记忆改回 App.vue**）。右侧悬浮按钮 → el-drawer(rtl, size 900) 内嵌 `AiChatPanel`。快捷键 `Ctrl/Cmd+K` 开关。开关状态存 `aiChat` store(`isOpen/togglePanel`)。
- **消息流**：UI → `useAiChat` → `aiChat store` → `sendChatMessage`（`src/ai/services/aiApi.ts`，**原生 fetch** `POST /backapi/ai/chat`，body `{messages,stream:true,conversationId?}`，手动注入 token，返回 AbortController）→ SSE 按行解析 `data:`，兼容 OpenAI `choices[0].delta.content` 与直接 `content`，`[DONE]` 结束 → 回调增量追加。
- **对话 CRUD**（走 Axios）：`GET /ai/conversations`、`GET /ai/conversations/:id`、`POST /ai/conversations/:id/delete`、`POST /ai/conversations/:id/update`。首次发消息后端自动建会话。store 持久化 key `aiChat`；标题=首条 user 消息(截断 30)，单会话上限 100 条。
- **读文章能力**（两路）：
  1. `ArticleDetail` 路由：仅注入文章 id，提示模型调后端工具 `get_article_content`/`search_articles`（后端 modules/ai，非流式工具循环）。
  2. `ReleaseArticle/UpdateArticle` 路由：读 `src/ai/store/articleEditor.ts` store 的正文（非持久化；`ReleaseArticle/index.vue` 负责写入标题/正文，`onBeforeUnmount` reset；超 8000 字符截断）。
- **上下文拼装** `buildSystemPrompt`：系统提示(`src/ai/constants.ts` DEFAULT_SYSTEM_PROMPT + `DEFAULT_MODEL='deepseek-v4-pro'`) + 当前路由/昵称 + 上述文章上下文。**注意：`useRoute()` 必须在 composable 顶层调用**（历史 bug）。
- `src/ai/memory/`、`src/ai/plan/`：特性开发记录与计划文档（AI 功能演进与踩坑，开发 AI 相关需求可先翻）。

---

## 九、跨模块开发约定（新增/修改功能前必读）

1. **自动导入**：Vue API、`useRoute/useRouter`、Element Plus 组件、`src/components` 与 `src/views/components` 组件、`src/utils/tool` 方法全部免 import（模板内同样可用）。局部页面组件需显式 import。
2. **新页面接入四步**：① `router/modules/{模块}/index.ts` 加路由（`meta:{name,icon}`，icon 用 icon-park 名字字符串）；② 页面组件放 `views/pages/模块/...`；③ 接口放 `api/模块/`（`index.ts` + `type.ts`）；④ 后端菜单表加一条 `type='2'` 菜单（`route`=路由 name）。
3. **新页面/新按钮的权限接入**：① 页面要在后端菜单里挂到某个 `type='2'` 节点下才能被导航；② 页面内的按钮加 `v-perm="'模块:资源:动作'"`（数组表示「满足其一即可」），并在后端菜单表加对应 `type='3'` 节点（`code` 必须与 `v-perm` 完全一致）；③ 后端写接口在 `config/permission.py` 的 `PERMISSION_PATH_MAP` 登记路径→权限码。
   - `v-perm` 是**隐藏**（`display:none`）不是移除节点，因此只能防误操作，真正的拦截靠后端映射表。列表/表格里靠 `v-perm` 隐藏的按钮，仍需保证后端有对应权限校验。
   - 不写 `v-perm` 的按钮视为「任何能看到该页面的角色都能点」，适用于不敏感的读操作。
   - **不在侧边栏的页面（顶栏入口、设置、弹窗里的功能）**：在菜单管理里挂到「全局」目录下（`isNav=false`），页面节点直接带 `code`（无路由时路由留空），按钮节点挂 `type='3'` 子节点。前端照常 `v-perm`。注意 `v-perm` 挂在**组件**上会作用到组件根元素，若根是 `el-popover` 之类（引用元素 + teleport）行为不确定，应挂在组件模板内部的根 `div` 上。
   - `v-perm` 只处理按钮显隐，**键盘快捷键 / 程序化入口要自己判**（如 `AiChatWidget` 的 Ctrl+K 额外判了 `hasPerm('global:topbar:ai')`）。
4. **列表页模板**：`AppSearchPanel` + `useSearch(originalParams, getDataFn, pageSize, isScroll)` + `AppPagination`；表单弹窗用 `useDialog<T>()`；字典用 `useDict(code)`。`useSearch` 翻页使用上次查询快照（`storageParams`），增删改后应 `initDataListHandler` 重置。搜索条件变更用 `filterDataListHandler`（回第 1 页）。
5. **上传文件必须传对 `type`**（后端按它分目录）。通用场景参考：文章正文 `article`、文章封面 `article-cover`、专栏封面 `article-column-cover`、头像 `avatar`、图标 `icon`、图片 `image`、心情 `mood`、简历 `resume`。
6. **事件总线**（mitt，类型强约束）：新增事件必须在 `src/utils/eventBus/index.ts` 的 `Events` 里补（历史坑：漏过 `task:copy`）。现有：`task:refresh(bool)/task:update/task:copy/user:stats-refresh`。
7. **字典**：枚举展示一律转中文；需要新枚举项→在 `src/config/dict.ts` 分类树补 + 后端存字典项（字典分类树前端硬编码）。
8. **类型**：接口类型放 `api/**/type.ts`，与 Form 类型 `+{id,createTime}` 交叉成 Item；全局类型在 `types/global.d.ts`；不要在多个地方重复定义（项目已有 `UserInfoType` 双处定义不一致、`email` 顶层/profile 混用的历史问题）。
9. **样式**：用 `--sys-*`/`--theme-*` 变量与 `common/index.scss` 语义类；列表卡片容器类可参考既有页面（`wrapper-item` 等）。UnoCSS 属性化在模板常用。
10. **颜色语义化函数**（utils/tool）：`getColorPair(±5 打分值)`、`getTagColor(标签名哈希)`、`toRgba(color,a)`、`randomColor()`。
11. **日期**：统一 `dayjs`（`fmtTime`/`dateDiff`），日期选择器常配 `value-format="YYYY-MM-DD HH:mm:ss"`。

---

## 十、已知未完成 / 占位 / 易踩坑清单（改动前自查）

**功能未完成（多数前端已留 UI / api 已备，但未接线）**
- 文章分类「删除」；文章标签「删除」；图标/图片分类「删除」——按钮无 `@click`（相应 `deleteXxxApi` 多已定义）。菜单管理「删除」已接线。
- `MessageBtn` 无逻辑；`ActiveUser`、`StatCard` 首页被注释/空实现。
- 用户管理：重置密码（无 API）、删除用户、头像上传 均缺。
- 更新日志无删除按钮；字典页「新增」文案歧义（实为给当前字典码加 key/value）。
- 个人资料 `birthday` 未实现编辑；`SelectImage`、`AppAutoUpload` 空壳。

**类型 / 结构坑**
- `getArticleDetailApi` 返回 `any`，详情/编辑数据全靠字段约定；列表类型 `author/category` 声明为 string 实为对象，需拍平。
- `ArticleListItemType.author` 直接渲染会显示 [object Object]。
- `UserInfoType` 在 `store/user/type.ts` 与 `api/user/type.ts` 两处定义、字段不一致。
- 多处 `prop` 名与字段名不一致（`el-form-item prop="visible"` vs `isCurrentVersion` 等），多为无害遗留。
- service.ts 中 `fmtResData/columnList` 部分冗余未用（ArticleCategory、User Task 等）。
- `StatEnum.UserTask='column'` 命名误导；`getIconCategoryListApi`(GET) 与 `getImageCategoryListApi`(POST) 方法不一致。
- `AppButton` **没有 `disabled` 属性**（渲染成裸 `<div>`，`click` 走 attrs 透传），传 `:disabled` 不生效、仍可点击。需要禁用时用样式（`opacity`+`pointer-events:none`）配合 handler 内兜底判断。

**行为 / 逻辑坑**
- ReleaseArticle(新建) 被 keep-alive 缓存，切 tab 回来内容残留且 store reset 不触发。
- 抽屉依赖字典 `statusList[0]/[1]` 下标；标签颜色、任务标签过滤（内存过滤+手动分页）为个人数据量折衷方案。
- 成功判断 `if(data)` 与 `code===0` 混用。
- `AppEcharts` 首帧暗色背景可能需等 option 变化才生效。
- 提醒为纯前端轮询 + localStorage 去重（key 含触发时间，改任务会再提醒一次属预期）。
- 语音识别：`stop/pause` 勿再手动合并 interimText（否则重复）；标点恢复已停用，`finalText` 为无标点原文。
- 复制事项必须剥离 id。
- `el-popover` 内容 teleport 到 body，scoped 样式需 `popper-class` 或用非 scoped / `:deep`。
- 冷启动类型检查可能因 auto-imports.d.ts 未重生成而短暂报工具函数找不到，重新生成即可。

---

*文档结构（若需更新）：一~六 基础设施与约定 → 七 功能模块 → 八 AI → 九 开发约定 → 十 坑点清单。功能模块内「页面职责 / 字段 / 接口路径 / 坑」四要素。*
