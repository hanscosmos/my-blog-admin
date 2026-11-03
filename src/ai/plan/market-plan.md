# 市场行情首页展示方案

## 需求理解

- **目标**：在首页新增一个与现有业务无关的「市场行情」板块，展示 A 股指数、美股指数、现货金银、原油、外汇（离岸人民币 + 中间价）的最新价、当日涨跌、是否开盘。
- **验收标准**：
  - 首页能一屏看到 4 组行情，数据与公开行情源一致；
  - 每组有「交易中 / 午间休市 / 已收盘 / 休市」状态；
  - 支持手动刷新，刷新后显示数据更新时间；
  - 不引入付费 API、不在前端暴露密钥；
  - 浅色/深色主题正常，涨红跌绿；
  - 不新增路由、菜单，不影响现有首页功能。

## 现有实现

- 首页入口：[src/views/pages/WorkBench/Home/index.vue](src/views/pages/WorkBench/Home/index.vue)，由 `HomeOverview → StatKPIBar → ArticlePublishStat → RecentUserTask/HotArticle → UserTaskScoreStat` 纵向堆叠，每个区块用 `section-wrapper` 包裹。
- 首页**不在 keep-alive 缓存内**，每次进入都会重新挂载，适合组件内直接请求。
- 接口层约定 `src/api/{模块}/index.ts + type.ts`，统一 `request.post`，后端返回 `{code,msg,data}`。
- HTTP 走 `/backapi` 代理到 `127.0.0.1:8000`，[src/utils/request/index.ts:32](src/utils/request/index.ts#L32)。
- 后端 Django 函数视图 + 中间件统一鉴权，读接口无需登记 `PERMISSION_PATH_MAP`；已配置 Redis 缓存（`django_redis`），`requests` 已在依赖中。
- 涨跌配色可复用中国习惯：正红负绿（`getColorPair` 也是该口径）。

## 数据源选型（免费、无 Key）

| 分组 | 展示项 | 上游标识 | 来源 |
|---|---|---|---|
| A 股 | 沪深300 / 创业板指 / 科创50 | `sh000300` / `sz399006` / `sh000688` | 腾讯 `qt.gtimg.cn` |
| 美股 | 标普500 / 纳斯达克100 | `usINX` / `usNDX` | 腾讯 `qt.gtimg.cn` |
| 贵金属 | 伦敦金现货 / 伦敦银现货 | `hf_XAU` / `hf_XAG` | 腾讯 `qt.gtimg.cn` |
| 原油 | 布伦特原油 / NYMEX 原油 | `hf_OIL` / `hf_CL` | 腾讯 `qt.gtimg.cn` |
| 外汇 | 离岸人民币 USD/CNH | `fx_susdcnh` | 新浪 `hq.sinajs.cn`（需带 Referer） |
| 外汇 | 人民币中间价 USD/CNY | `CcprHisNew` | 中国外汇交易中心（CFETS） |

我已实际联调验证：以上接口均可返回最新数据，无需注册、无调用配额。

**费用对比**：Alpha Vantage 免费额度已降到 25 次/天，Finnhub 免费版不含 A 股/商品，Tushare Pro 需积分，聚合数据等按量计费——都不适合本需求。腾讯/新浪/CFETS 为免费公开行情页接口，个人低频率使用足够；后端加缓存后调用量可忽略。

## 推荐方案

### 架构：后端代理 + 缓存（推荐）

```
浏览器 → /backapi/sys/market/overview → Django（requests 拉取 + Redis 缓存）→ 腾讯/新浪/CFETS
```

**必须走后端**的原因：
- 腾讯/新浪接口无 CORS 响应头，新浪还要求 `Referer`，浏览器直连必定失败；
- 前端直连只能靠 Vite dev proxy，生产环境还得改 Nginx，且无法统一缓存和降级；
- 后端已有统一鉴权中间件，接口天然只对已登录用户开放。

替代方案（不推荐）：拦截 `/marketapi` 由 Vite/Nginx 转发。优点是后端零改动；缺点是要维护生产 Nginx 配置、无缓存、上游失败时无兜底。仅在前端本地验证时作为临时手段。

### 后端设计（my-blog-service，无数据库/无迁移）

新增，全部放在 `modules/system` 下，不新建 app：

| 文件 | 内容 |
|---|---|
| `modules/system/service/market.py` | 上游请求、GBK 解码、行情解析、交易时段判断、缓存读写 |
| `modules/system/views/market.py` | `get_market_overview(request)`，`@require_POST` + `res_handle` |
| `modules/system/urls.py` | 注册 `path('market/overview', get_market_overview)` |

**接口**：`POST /sys/market/overview`，body `{}` 或 `{ "force": true }`（手动刷新绕过 30s 缓存）。

**响应结构**：

```json
{
  "code": 0, "msg": "查询成功",
  "data": {
    "updateTime": "2026-11-03 18:02:05",
    "stale": false,
    "groups": [
      {
        "key": "cn", "name": "A股指数",
        "status": "open|break|closed|holiday",
        "statusText": "交易中",
        "items": [
          {
            "key": "sh000300", "name": "沪深300",
            "price": 4008.87, "change": -8.05, "changePercent": -0.2,
            "precision": 2, "quoteTime": "2026-11-03 16:14:12"
          }
        ]
      }
    ]
  }
}
```

中间价条目额外返回 `quoteDate` 与相对上一交易日的 `change/changePercent`。

**交易时段判断**（后端用 `zoneinfo`，自动处理夏令时）：
- A 股：周一至周五 09:30–11:30、13:00–15:00（北京时间），11:30–13:00 为午间休市；
- 美股：周一至周五 09:30–16:00（美东时间，只算常规时段）；
- 商品/外汇：周一 06:00 至周六 05:00（北京时间），每日 05:00–06:00 休市；
- 中间价：不判断开市，展示发布工作日与「每日 09:15 更新」；
- **节假日识别**：在交易时段内比较行情自带的日期（A 股 `f30`、美股 `f30`）与市场当地今天，不一致即判定为节假日休市，避免维护节假日表。

**缓存与降级**：
- 正常缓存 key `market:overview`，TTL 30s；上游总耗时约 3 次 HTTP；
- 另存一份 `market:overview:stale`，TTL 10 分钟；上游超时/报错时返回旧数据并置 `stale: true`；
- 超时 5s，单组失败不影响其他组（组内 `items[].price` 为 `null`）。

### 前端设计

| 文件 | 内容 |
|---|---|
| [src/api/market/type.ts](src/api/market/type.ts) | `MarketGroupType / MarketItemType / MarketOverviewType` |
| [src/api/market/index.ts](src/api/market/index.ts) | `getMarketOverviewApi(force?: boolean)` |
| [src/views/pages/WorkBench/Home/components/MarketOverview.vue](src/views/pages/WorkBench/Home/components/MarketOverview.vue) | 行情主组件 |
| [src/views/pages/WorkBench/Home/index.vue](src/views/pages/WorkBench/Home/index.vue) | 在 `HomeOverview` 之后插入一行 |

**布局**：一个通栏 `section-wrapper`，内部 4 列（`el-row` + `el-col :xs="24" :sm="12" :lg="6"`）：
- A股指数：沪深300、创业板指、科创50
- 美股指数：标普500、纳斯达克100
- 商品：伦敦金、伦敦银、布伦特原油、NYMEX原油
- 外汇：USD/CNH、人民币中间价

**单项展示**：名称 + 组内状态点（交易中绿点/休市灰点）→ 最新价（保留精度、千分位）→ 涨跌额、涨跌幅（正红负绿，带 +/-）。

**交互**：
- 右上角「更新时间 + 刷新按钮」，刷新时按钮 loading，请求 `force: true`；
- 可选自动刷新：页面顶部提供开关，默认关闭，开启后 60s 一次，`useDocumentVisibility` 切到后台时暂停，组件卸载时清理定时器；
- 失败时保留上次数据并提示「行情更新失败，数据更新于 xx」，组级失败显示占位；
- 鼠标悬停单价显示行情时间，底部一行小字「数据仅供参考，美股行情可能延迟」。

**不需要改动**：路由、菜单、Pinia store、后端数据库、权限表。

## 风险与边界

1. **非官方接口稳定性**：腾讯/新浪接口可能改格式或限制服务端 IP。对策是解析层集中、单组失败不拖垮整体、旧缓存兜底、页面显示数据时间。
2. **行情延迟**：美股免费源通常延迟约 15 分钟，不适用于交易决策，页面上明确提示。
3. **节假日判定是启发式**：依赖行情自带日期；当天首次开盘前几秒可能短暂显示「休市」，影响可忽略。
4. **服务端出网**：生产服务器必须能访问 `qt.gtimg.cn`、`hq.sinajs.cn`、`www.chinamoney.com.cn`；若不能，需要改为部署侧转发（届时再评估）。
5. **数据合规**：个人后台、低频率拉取、不对外分发，风险可控；不建议把该接口暴露给 `client` 端。
6. **首页每次进入重挂载**：会触发一次请求，配合 30s 缓存不会对上游造成压力。

## 实施计划

1. 后端 `service/market.py`：批量拉取与解析（腾讯一次批量 + 新浪 CNH + CFETS 中间价），交易时段/节假日判定，Redis 缓存与 stale 兜底。
2. 后端 `views/market.py` + 注册 `sys/market/overview` 路由；用带 token 的请求自测。
3. 前端 `src/api/market/`：类型与接口封装。
4. 前端 `MarketOverview.vue`：四组卡片、格式化、涨跌配色、刷新/自动刷新/错误态。
5. 插入 [Home/index.vue](src/views/pages/WorkBench/Home/index.vue) 的 `HomeOverview` 之后。
6. `npm run build-check` 类型检查与构建。
7. 同步更新 [docs/PROJECT_GUIDE.md](docs/PROJECT_GUIDE.md) 首页章节与接口清单。

## 验证方案

- `curl` 带 token 请求新接口，核对沪深300、标普500、伦敦金、USD/CNH、中间价与原始页面一致；
- 连续两次 30s 内请求验证缓存命中，`force: true` 验证绕过；
- 断开外网/改错域名，验证 stale 兜底与前端错误提示；
- 午休、收盘后、周末分别验证状态文案；
- 浅色/深色主题、4 列/2 列响应式、刷新 loading、自动刷新后台暂停；
- `npm run build-check` 通过。

## 待确认问题

1. **是否同意后端新增 `/sys/market/overview` 接口？**（仅新增视图、服务、路由，无数据库迁移。按项目约定需先征求你的意见。）
2. **接受上述免费非官方行情源吗？** 还是希望换成付费/官方数据源（成本会显著上升）。
3. **自动刷新**要不要？建议默认关闭、手动刷新为主，避免无谓请求。
4. **展示位置**默认放在 `HomeOverview` 下方、通栏 4 列；如需放在页面顶部或其他位置请说明。
5. 中间价展示「最新发布值 + 较上一发布日变动」，是否符合预期？

1. 同意后端新增加接口，2. 接收免费非官方行情源；3.如果可以自动刷新，那么加上，默认关闭，可以手动开启，如果实现起来复杂，有费用成本，那么暂时不做；4.展示位置按你的建议来做；5.中间价只展示最新发布值即可