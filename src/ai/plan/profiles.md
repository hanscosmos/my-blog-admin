# 关于个人相关功能模块的开发

1. 数据存储在数据库里
2. 主要是有关博主（我自己的一些数据），包括基本介绍，联系方式（包括号码，社交帐号，网站等），资产信息（个人查看），简历（文件）
3. 页面上要有对应的入口可供角色为超级管理员的用户对相关进行查看编辑。
4. 基本介绍支持markdown编辑，使用项目中用到的markdown编辑器就行

---

# 设计方案

## 一、技术栈与现有项目约束

- **前端框架**: Vue 3 + TypeScript + Element Plus + UnoCSS
- **路由**: Vue Router（基于 `src/router/modules/` 模块化路由）
- **Markdown 编辑器**: `@kangc/v-md-editor`（项目已封装 `src/components/common/AppMdEditor`）
- **API 层**: axios 封装在 `src/utils/request`，API 按模块组织在 `src/api/` 下
- **图片上传**: 已有 `AppImageAutoUpload` 组件
- **数据库**: 后端独立项目（本仓库为纯前端 admin），数据库由后端管理
- **权限**: 基于角色的权限控制，超级管理员角色可访问管理入口

## 二、数据模型设计

后端需新增/扩展以下数据表（或扩展已有 user profile 表）：

### 2.1 `BloggerProfile` 博主档案表

| 字段           | 类型          | 说明                                 |
| -------------- | ------------- | ------------------------------------ |
| id             | string (UUID) | 主键                                 |
| userId         | string        | 关联用户ID（一对一）                 |
| introduction   | text          | 基本介绍（Markdown 格式）            |
| phone          | string        | 联系电话                             |
| wechat         | string        | 微信号                               |
| qq             | string        | QQ号                                 |
| github         | string        | GitHub 主页URL                       |
| weibo          | string        | 微博主页URL                          |
| site           | string        | 个人网站URL                          |
| resumeFileUrl  | string        | 简历文件URL（PDF等）                 |
| resumeFileName | string        | 简历原始文件名                       |
| assets         | json          | 资产信息（JSON结构，仅博主本人可见） |
| createdAt      | datetime      | 创建时间                             |
| updatedAt      | datetime      | 更新时间                             |

> **资产信息 JSON 结构示例**:
>
> ```json
> {
>   "items": [
>     { "label": "粉丝数", "value": "1200" },
>     { "label": "文章总数", "value": "56" },
>     { "label": "获赞数", "value": "3400" }
>   ]
> }
> ```

## 三、API 接口设计

在 `src/api/` 下新建 `blogger/` 模块：

| 接口                      | 方法 | 路径                      | 说明         |
| ------------------------- | ---- | ------------------------- | ------------ |
| `getBloggerProfileApi`    | POST | `/blogger/profile/get`    | 获取博主档案 |
| `updateBloggerProfileApi` | POST | `/blogger/profile/update` | 更新博主档案 |

前端 API 文件: `src/api/blogger/index.ts` + `src/api/blogger/type.ts`

### Type 定义

```typescript
// src/api/blogger/type.ts
export type SocialLinkItem = {
  key: string;
  label: string;
  value: string;
  icon?: string;
};

export type AssetItem = {
  label: string;
  value: string;
};

export type BloggerProfileFormType = {
  introduction: string; // Markdown
  phone: string;
  wechat: string;
  qq: string;
  github: string;
  weibo: string;
  site: string;
  resumeFileUrl: string;
  resumeFileName: string;
  assets: { items: AssetItem[] };
};

export type BloggerProfileType = BloggerProfileFormType & {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};
```

## 四、前端页面设计

### 4.1 页面入口

在 **个人中心** (`/user-profile`) 的 Tab 栏中新增一个 tab 项 **"博主档案"**，仅超级管理员角色可见。

```typescript
// 在 src/views/pages/User/Profile/index.vue 的 tabList 中新增：
{
  name: '博主档案',
  key: 'blogger-profile',
  component: shallowRef(BloggerProfile),
  permission: 'super-admin',  // 或通过路由 meta 判断
}
```

### 4.2 页面布局

页面位于 `src/views/pages/User/Profile/pages/BloggerProfile/index.vue`，分为三个区域，使用 Element Plus 的 `el-tabs` 或卡片分块展示：

```
┌─────────────────────────────────────────────────┐
│                  博主档案管理                      │
├─────────────────────────────────────────────────┤
│  [基本介绍]  [联系方式]  [资产信息]  [简历]        │ ← el-tabs
├─────────────────────────────────────────────────┤
│                                                 │
│  Tab1 - 基本介绍:                                │
│    ┌───────────────────────────────────────┐    │
│    │  [Markdown 编辑器 (AppMdEditor)]        │    │
│    │  支持实时预览，图片上传                  │    │
│    └───────────────────────────────────────┘    │
│    [保存]                                        │
│                                                 │
│  Tab2 - 联系方式:                                │
│    联系电话: [________]                          │
│    微信号:   [________]                          │
│    QQ号:     [________]                          │
│    GitHub:   [________]                          │
│    微博:     [________]                          │
│    个人网站:  [________]                          │
│    [保存]                                        │
│                                                 │
│  Tab3 - 资产信息:                                │
│    ┌───────────────────────────────────────┐    │
│    │  标签        值                         │    │
│    │  [粉丝数]    [1200]      [删除]         │    │
│    │  [文章总数]  [56]        [删除]         │    │
│    │  [+ 新增资产项]                         │    │
│    └───────────────────────────────────────┘    │
│    [保存]                                        │
│                                                 │
│  Tab4 - 简历:                                    │
│    当前简历: resume.pdf [预览] [删除]             │
│    [上传新简历]                                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 4.3 组件拆分

```
src/views/pages/User/Profile/pages/BloggerProfile/
├── index.vue                    # 主页面容器（tab切换）
├── IntroductionEdit.vue         # 基本介绍 Markdown 编辑
├── ContactEdit.vue              # 联系方式编辑
├── AssetsEdit.vue               # 资产信息编辑
└── ResumeEdit.vue               # 简历上传管理
```

### 4.4 各组件说明

#### IntroductionEdit.vue

- 使用项目已有的 `AppMdEditor` 组件
- 支持 markdown 编辑 + 预览
- 图片上传复用已有的 `uploadFile` 逻辑
- 底部放「保存」按钮，调用 `updateBloggerProfileApi`

#### ContactEdit.vue

- 使用 `el-form` + `el-input`
- 每个社交账号输入框前加 icon 前缀（使用 `@icon-park/vue-next` 或 `AppIcon`）
- URL 类型字段加格式校验

#### AssetsEdit.vue

- 使用 `el-table` 或动态表单列表展示资产项
- 支持增删改
- 数据存为 JSON 格式

#### ResumeEdit.vue

- 文件上传组件，限制仅 PDF 格式
- 显示已上传简历文件名 + 下载/预览链接
- 上传后保存文件URL到后端

## 五、权限控制

- 页面级：在 `BloggerProfile/index.vue` 挂载时检查当前用户角色
- 判断逻辑：读取 `useUserInfoStore()` 中的角色信息，若非超级管理员则隐藏该 tab 或展示无权限提示
- 也可在路由 `meta` 中添加 `roles: ['super-admin']`，由路由守卫拦截

## 六、文件清单

### 新增文件

| 文件                                                                     | 说明             |
| ------------------------------------------------------------------------ | ---------------- |
| `src/api/blogger/type.ts`                                                | 博主档案类型定义 |
| `src/api/blogger/index.ts`                                               | 博主档案 API     |
| `src/views/pages/User/Profile/pages/BloggerProfile/index.vue`            | 主页面           |
| `src/views/pages/User/Profile/pages/BloggerProfile/IntroductionEdit.vue` | 基本介绍编辑     |
| `src/views/pages/User/Profile/pages/BloggerProfile/ContactEdit.vue`      | 联系方式编辑     |
| `src/views/pages/User/Profile/pages/BloggerProfile/AssetsEdit.vue`       | 资产信息编辑     |
| `src/views/pages/User/Profile/pages/BloggerProfile/ResumeEdit.vue`       | 简历上传管理     |

### 修改文件

| 文件                                     | 修改内容                                   |
| ---------------------------------------- | ------------------------------------------ |
| `src/views/pages/User/Profile/index.vue` | tabList 中新增「博主档案」入口，加角色判断 |

## 七、实现步骤

1. **定义类型和 API** — `src/api/blogger/type.ts` + `src/api/blogger/index.ts`
2. **创建主页面框架** — `BloggerProfile/index.vue`，使用 `el-tabs` 分四个 tab
3. **实现基本介绍编辑** — `IntroductionEdit.vue`，嵌入 `AppMdEditor`
4. **实现联系方式编辑** — `ContactEdit.vue`，表单输入 + 校验
5. **实现资产信息编辑** — `AssetsEdit.vue`，动态列表
6. **实现简历上传** — `ResumeEdit.vue`，文件上传 + 预览
7. **接入个人中心入口** — 修改 `User/Profile/index.vue`，在 tabList 中注册新 tab，加角色权限判断
8. **联调测试** — 确保 CRUD 流程完整，权限控制生效

## 八、注意事项

- Markdown 编辑器中的图片上传应复用项目已有的 `uploadFile` 函数
- 资产信息为 JSON 存储，前后端需约定结构保持一致
- 简历文件上传需限制文件大小（建议 ≤ 5MB）和格式（PDF）
- 联系方式中的 URL 字段需校验格式合法性
- 所有编辑操作应有 loading 状态和成功/失败反馈
- 超级管理员判断逻辑需与项目现有权限体系保持一致
