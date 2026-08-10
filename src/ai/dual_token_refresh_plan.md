# 双 Token 自动续期方案

## 需求背景

系统原先只有单一 Access Token，48 小时硬过期（`TOKEN_WORK_TIME=48`），无任何续期机制。即使每天使用，超过 48 小时必被强制登出，体验差。

## 目标

实现 **Access Token（短期）+ Refresh Token（长期）** 的双 Token 架构，前端自动静默刷新，用户无感知续期。

## 方案原理

```
登录 → 返回 access_token (30min) + refresh_token (30d)
     → 两个 token 均存储于 localStorage

正常请求 → Authorization header 携带 access_token
          → 后端中间件验证

access_token 过期 → 后端返回 { code: 401 }
                  → 前端拦截器捕获，自动用 refresh_token 调 POST /user/refresh
                  → 后端验证 refresh_token → 返回新 access_token
                  → 前端更新 access_token → 静默重试原请求
                  → 用户无感知 ✅

refresh_token 也过期/无效 → 清除数据 → 跳转登录页
```

## 总体架构

```
┌─────────────┐          ┌─────────────────┐          ┌──────────────┐
│  前端 Vue3   │  HTTP    │  Django 中间件    │  验证     │  JWT Token   │
│  Axios 拦截器│ ──────→ │  AuthMiddleWare  │ ──────→ │  (PyJWT)     │
│             │          │                 │          │              │
│  401 自动刷新│ ←────── │  validate_token  │ ←────── │  HS256 签名   │
└─────────────┘          └─────────────────┘          └──────────────┘
```

## Token 规格

| 属性 | Access Token | Refresh Token |
|------|-------------|---------------|
| 有效期 | **30 分钟** | **30 天** |
| 存储位置 | localStorage | localStorage |
| 传输方式 | `Authorization` header | POST body (`refreshToken`) |
| JWT payload | `{ userInfo, type: 'access', exp }` | `{ userInfo, type: 'refresh', exp }` |
| 用途 | API 鉴权 | 换取新的 Access Token |
| 签算法 | HS256 | HS256 |

## 改动清单

### 后端（my-blog-service）

| 文件 | 改动说明 |
|------|----------|
| `.env` | 新增 `ACCESS_TOKEN_WORK_TIME=0.5`（小时，即 30 分钟），`TOKEN_WORK_TIME` 改 720（30 天） |
| `config/config.py` | `Config` dataclass 新增 `ACCESS_TOKEN_WORK_TIME: float` 字段 |
| `config/choices.py` | `WHITE_PATH_LIST` 新增 `/user/refresh` |
| `utils/auth.py` | 新增 `validate_refresh_token()`；`validate_token()` 和 `get_user_id()` 拒绝 `type: 'refresh'` 的 token |
| `modules/user/service/user.py` | `generate_token()` 使用 `ACCESS_TOKEN_WORK_TIME` 并添加 `type: 'access'`；新增 `generate_refresh_token()` 使用 `TOKEN_WORK_TIME` 并添加 `type: 'refresh'` |
| `modules/user/views/user.py` | 登录视图 `user_login_admin_system` 额外返回 `refreshToken`；新增 `user_refresh_token` 视图函数 |
| `modules/user/urls.py` | 新增路由 `path('refresh', user_refresh_token, ...)` |

### 前端（my-blog-admin）

| 文件 | 改动说明 |
|------|----------|
| `src/store/user/index.ts` | 新增 `refreshToken` 状态，`clearUserData()` 中一并清除 |
| `src/api/type.ts` | `ResLoginType` 新增 `refreshToken: string`；新增 `ResRefreshTokenType` |
| `src/api/index.ts` | 新增 `refreshTokenApi` |
| `src/views/pages/Global/Login/index.vue` | 登录成功后额外保存 `refreshToken.value = data.refreshToken` |
| `src/utils/request/index.ts` | **核心改动**：响应拦截器新增 `isRefreshing` + `subscribers` 并发去重刷新逻辑；修复 HTTP 401 分支（原仅有注释无实际清理动作） |

## 前端刷新拦截器流程

```
响应 code === 401
    │
    ├── url === '/user/login' ？ → 直接登出（无需刷新）
    ├── url === '/user/refresh' ？ → 直接登出（Refresh Token 也过期了）
    ├── _isRetry === true ？ → 直接登出（防止死循环）
    ├── !refreshToken ？ → 直接登出（无 Refresh Token 可用）
    │
    ├── isRefreshing === true ？ → 加入 subscribers 队列等待
    │
    └── isRefreshing = true
         │
         POST /user/refresh { refreshToken }
         │
         ├── 成功 → 更新 store.token → onRefreshed(newToken)
         │         → 所有等待请求带新 token 重试
         │
         └── 失败 → clearUserData() → location.replace('/login')
```

## 并发去重

当多个请求同时返回 401 时，只有第一个触发 `/user/refresh`，其余请求挂入 `subscribers` 队列。刷新完成后一次性通知全部重试，避免并发刷新。

## 安全考量

- Access Token 短期（30 分钟），即使泄露影响窗口有限
- Refresh Token 仅用于刷新端点，不参与 API 鉴权
- `validate_token()` 拒绝 `type: 'refresh'` 的 token 通过接口鉴权
- 刷新端点加入白名单，不依赖 Access Token 鉴权
- 已废弃配置 `USER_REFRESH_TOKEN_TIME` 保留在 `.env` 中不影响运行

## 环境配置参考

```env
# my-blog-service/.env
ACCESS_TOKEN_WORK_TIME=0.5   # Access Token 有效期（小时），0.5 = 30 分钟
TOKEN_WORK_TIME=720          # Refresh Token 有效期（小时），720 = 30 天
```

## 验证要点

1. 登录后 localStorage 中存在 `token` 和 `refreshToken`
2. 正常请求携带 `Authorization` header
3. 将 localStorage 中的 `token` 改错 → 触发 401 → Network 面板可见 1 次 `/user/refresh` → 请求重试成功
4. 同时发送多个请求 → 仍只有 1 次 `/user/refresh`
5. 将 `refreshToken` 也改错 → 跳转登录页
6. 登出后 localStorage 中 `token` 和 `refreshToken` 均被清除
