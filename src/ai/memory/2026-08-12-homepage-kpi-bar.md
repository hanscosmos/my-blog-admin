# 首页统计指标改为轻量 KPI 条（2026-08-12）

## 需求背景

首页原先有 `StatCard` 组件展示系统级统计数据（文章、用户等），但被注释掉了，原因：

1. 样式不够简洁，240px 高的重型卡片放在首页显得笨重
2. 统计类型需要调整——"专栏"没有必要
3. 放在首页什么位置不确定

## 关键决策

### 统计指标选择

保留 3 个核心指标，去掉专栏：

| 指标 | API type 参数 | 理由 |
|------|-------------|------|
| 文章总数 | `article` | 核心资产 |
| 草稿箱 | `drafts` | 关注待发布内容 |
| 用户总数 | `user` | 增长指标 |

> 注意：`HomeOverview` 展示的是**个人维度**（`/sys/self/stat`，年/月/周），KPI 条展示的是**系统全局**总量＋环比（`/sys/stat`），两者不重复。

### 设计方向

- 放弃重型卡片，改为横向 KPI 指标条（约 115px 高）
- 每个指标：图标（主题色半透明底）→ 标签 → 大数字 → 较上月趋势箭头
- 环比数据：绿色 ↑ 正增长 / 红色 ↓ 负增长
- 数字过万自动格式化为 `x.xw`

### 位置

放在 HomeOverview（欢迎＋个人统计）和 ArticlePublishStat（趋势图）之间，形成「个人 → 全局概览 → 深入数据」的信息层级。

## 改动清单

### 新建文件

- [StatKPIBar.vue](../../views/pages/WorkBench/Home/components/StatKPIBar.vue) — 轻量 KPI 指标条组件
  - 使用 `Promise.all` 并行请求 3 个 `/sys/stat` 接口
  - 默认环比维度为"月"
  - 跟随系统主题色（`systemColor`），图标底用 `toRgba(color, 0.12)` 半透明

### 修改文件

- [index.vue](../../views/pages/WorkBench/Home/index.vue) — 在 HomeOverview 和 ArticlePublishStat 之间新增一行放置 StatKPIBar；新增 import

### 保留不动

- `StatCard.vue` 和 `ActiveUser.vue` 的注释代码及 import 暂未清理，后续可删

## 样式参数（调优后）

| 参数 | 值 | 说明 |
|------|-----|------|
| 垂直内边距 | `py-7` (28px) | 整体约 115px 高 |
| 分布方式 | `justify-evenly` | 宽屏下间距均匀，不挤 |
| 图标与文字间距 | `gap-5` (20px) | 内部不拥挤 |
| 图标圆圈 | 48px，图标 20px | 视觉存在感 |
| 数字字号 | `text-3xl` | 比之前 text-2xl 更有分量 |

## 后续注意事项

- `/sys/stat` 接口返回的 `StatItemType` 含 `this` 字段（JS 保留字），模板中直接使用需注意，当前 KPI 条只用到 `count` 和 `diff`，不受影响
- 如果后续需要加回"今日访问量"，需后端新增接口——目前只有文章级别的访问次数，没有站点全局访问统计
- `StatEnum.UserTask`（值为 `'column'`）实际在后端对应的是用户任务而非专栏，StatCard 里标为"专栏"是误导
