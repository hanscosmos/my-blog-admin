# 会话续期与刷新令牌实现方案（Django 后端 + 前端）

本文档列出在后端（Django）与前端（Vue 3 / Axios）需要完成的具体工作、实现要点、示例配置与测试建议，便于逐步落地并回归验证。

---

## 背景与目标

问题：Access Token 到期后用户频繁被强制登出（当前为 2 天），需要改进以提升使用体验并保证安全。

目标：使用短期 Access Token + 长期 Refresh Token 的组合，实现静默续期（用户无感刷新）、并发刷新去重、刷新令牌轮换与撤销机制，同时降低 XSS/CSRF 风险。

约定：后端使用 Django + djangorestframework + djangorestframework-simplejwt；前端为本仓库（Vue 3 + Axios）。

---

## 一、总体架构概览

- Access Token（短期，推荐 15–60 分钟）：用于 API 鉴权，前端在内存或 Vuex 中保存，用于 `Authorization: Bearer <token>`。
- Refresh Token（长期，推荐 7–30 天）：由后端颁发并以 `HttpOnly`、`Secure` cookie 下发，前端不可读；用于交换新的 Access Token。
- 刷新端点（后端）：`POST /api/auth/refresh/`，读取 refresh cookie 并返回新的 access（并可在轮换时设置新的 refresh cookie）。
- 前端：在 `src/utils/request/index.ts` 添加 Axios 拦截器处理自动刷新与并发去重；在全局监听用户活动实现滑动续期/静默刷新，并在必要时弹出到期提示。

---

## 二、后端（Django）具体任务

1. 安装与基础配置（如果项目中已经安装就不用再安装了）
   - 安装：`pip install djangorestframework djangorestframework-simplejwt`
   - `settings.py` 中：
     - 加入 `rest_framework` 与 `rest_framework_simplejwt.token_blacklist` 到 `INSTALLED_APPS`。
     - 添加 REST_FRAMEWORK 的默认认证类为 `JWTAuthentication`。
     - 配置 SimpleJWT（示例）：
```py
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=14),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}
```
   - 运行迁移：`python manage.py migrate（ps:我觉得似乎没有必要迁移）`

2. 登录（颁发 token）
   - 登录接口（例如 `POST /api/auth/login/`）在成功认证后生成 `RefreshToken.for_user(user)`：
     - 返回 `access`（JSON）给前端。
     - 在响应中通过 `response.set_cookie()` 设置 `refresh_token` 为 `HttpOnly, Secure, SameSite=Lax`，并设置合适 `max_age`。

3. 刷新接口 `POST /api/auth/refresh/`
   - 从请求的 cookie 中读取 `refresh_token`。
   - 使用 `RefreshToken(token)` 验证并获取 `refresh.access_token`。
   - 若启用 `ROTATE_REFRESH_TOKENS=True`：黑名单旧 refresh（simplejwt 的 `blacklist()`），并生成新的 refresh（`RefreshToken.for_user(user)`），设置新的 refresh cookie。返回 `{'access': <access_token>}`。
   - 刷新失败返回 401，响应体包含错误提示。

4. 登出 / 撤销
   - `POST /api/auth/logout/`：读取 refresh cookie，调用 `RefreshToken(token).blacklist()`，并在响应中清除 cookie（`delete_cookie`）。

5. CSRF 与安全注意
   - 因 refresh 采用 cookie 传输，需防范 CSRF：
     - 优选设置 `SameSite=Lax/Strict` 与仅接受 `POST`。
     - 可要求前端在刷新请求里加自定义 header（例如 `X-Requested-With: XMLHttpRequest`），服务端验证该 header；或使用双重提交 cookie（前端可读的 csrf cookie + 服务端核验）。
     - 在生产环境确保 `secure=True` 并启用 HTTPS。

6. 日志、监控与撤销支持
   - 记录刷新、登录、登出事件（包括 IP、User-Agent、时间），便于异常排查。
   - 提供管理员接口：撤销指定用户的所有 refresh token（通过 simplejwt 的黑名单实现）。

7. 单元/集成测试（后端）
   - 登录成功能、刷新成功、轮换后旧 token 黑名单生效、刷新失败返回 401、登出后 refresh 无效。

8. 示例代码片段（简化，需根据项目改造）
```py
# views.py (核心逻辑示意)
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

REFRESH_COOKIE_NAME = 'refresh_token'
REFRESH_COOKIE_MAX_AGE = 14 * 24 * 60 * 60

def set_refresh_cookie(resp, token_str):
    resp.set_cookie(
        REFRESH_COOKIE_NAME,
        token_str,
        max_age=REFRESH_COOKIE_MAX_AGE,
        httponly=True,
        secure=True,
        samesite='Lax'
    )

@api_view(['POST'])
def refresh_view(request):
    token = request.COOKIES.get(REFRESH_COOKIE_NAME)
    if not token:
        return Response({'detail':'no token'}, status=status.HTTP_401_UNAUTHORIZED)
    try:
        refresh = RefreshToken(token)
        access = str(refresh.access_token)
        # 轮换示意：根据 payload 找 user
        user_id = refresh.payload.get('user_id')
        User = get_user_model()
        user = User.objects.get(id=user_id)
        if settings.SIMPLE_JWT.get('ROTATE_REFRESH_TOKENS'):
            try:
                refresh.blacklist()
            except Exception:
                pass
            new_refresh = RefreshToken.for_user(user)
            resp = Response({'access': access})
            set_refresh_cookie(resp, str(new_refresh))
            return resp
        return Response({'access': access})
    except Exception:
        return Response({'detail':'invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
```

---

## 三、前端（本仓库）具体任务

位置：`src/utils/request/index.ts`（请在该文件中实现/替换以下逻辑）

1. Axios 实例与基础：
   - `baseURL` 指向后端 API 前缀（例如 `/api`）。
   - `withCredentials: true`：确保浏览器在刷新请求时带上 httpOnly refresh cookie。

2. Access Token 存取函数
   - `getAccessToken()`：从内存或 Vuex 中读取当前 access。
   - `setAccessToken(token)`：更新内存/Vuex，并在需要时触发 token expiry 计算。
   - `logoutAndRedirect()`：清理本地状态并跳转登录页。

3. 拦截器：并发去重 + 刷新重试
   - 请求拦截器：在每个请求头上加入 `Authorization: Bearer ${access}`（若有）。
   - 响应拦截器：当响应状态为 401：
     - 若 `config._retry` 已设，直接 reject；
     - 若正在刷新（`isRefreshing=true`），将当前请求加入 `subscribers` 队列，等待刷新完成后重试；
     - 若未刷新，设置 `isRefreshing=true`，调用后端 `/api/auth/refresh/`（POST），成功后通过 `setAccessToken` 更新 access，并通知所有 `subscribers` 重试原请求；刷新失败则调用 `logoutAndRedirect()`。

   - 并发去重示意（isRefreshing + subscribers 模式）。

4. 用户活动检测与静默刷新策略
   - 在入口（`main.ts` 或认证模块）监听活动事件：`mousemove`, `keydown`, `click`, `visibilitychange`, 路由变化等，记录最后活动时间。
   - 通过解析 JWT (`exp`) 或后端下发的过期时间，维护 access 到期时间。
   - 定时器（例如每 15–30 秒检查一次）：若 `exp - now < threshold`（例如 60s）且用户最近有活动，则尝试静默刷新（调用 `/api/auth/refresh/`）。
   - 当用户长时间不活动且 access 快要到期时，可弹出提示（例如 60s 倒计时），允许用户点击延长；否则到期后自动登出。

5. UX 细节
   - 静默刷新应尽量不打扰用户；出现刷新失败时再展示显著提示并跳转登录。
   - 对重要操作（如保存、发布），在发送请求前确保 access 有效（可在发送前主动刷新）。

6. 测试场景（前端）
   - 正常流程：登录 → access 到期 → 静默刷新 → 请求重试成功。
   - 并发请求场景：多个请求同时返回 401，仅发起一次刷新且所有请求成功重试。
   - 刷新失败场景：刷新接口返回 401/500，应登出并展示提示。
   - 撤销场景：在别处撤销 refresh（后端黑名单），本端刷新失败并登出。

7. 示例 Axios 拦截器（精简示例，放入 `src/utils/request/index.ts`）
```ts
import axios from 'axios'
import { getAccessToken, setAccessToken, logoutAndRedirect } from '@/utils/auth'

const api = axios.create({ baseURL: '/api', withCredentials: true })
let isRefreshing = false
let subscribers: Array<(token: string) => void> = []
function subscribe(cb: (token: string) => void) { subscribers.push(cb) }
function onRefreshed(token: string) { subscribers.forEach(cb => cb(token)); subscribers = [] }

api.interceptors.request.use(cfg => {
  const token = getAccessToken()
  if (token) cfg.headers!['Authorization'] = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  async err => {
    const { config, response } = err
    if (!response) return Promise.reject(err)
    if (response.status === 401 && !config._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribe((token: string) => {
            config.headers['Authorization'] = `Bearer ${token}`
            resolve(api(config))
          })
        })
      }
      config._retry = true
      isRefreshing = true
      try {
        const r = await api.post('/auth/refresh/')
        const newToken = r.data.access
        setAccessToken(newToken)
        onRefreshed(newToken)
        return api(config)
      } catch (e) {
        logoutAndRedirect()
        return Promise.reject(e)
      } finally { isRefreshing = false }
    }
    return Promise.reject(err)
  }
)

export default api
```

---

## 四、集成、部署与回归测试步骤

1. 本地开发流程
   - 后端：新建/修改 views、urls，更新 `settings.py`，运行 `python manage.py migrate`。
   - 前端：实现 Axios 拦截器并启动 `npm run dev`（或等价命令），验证 `withCredentials` 与 cookie 行为。

2. 联调注意
   - 本地跨域：若前端 dev server 与 Django 不同 origin，确保后端允许跨域并设置 `Access-Control-Allow-Credentials: true`，前端 axios 设置 `withCredentials: true`。
   - Cookie domain/path 设置需匹配部署环境。

3. 上线与回滚
   - 首先在 staging 环境验证所有测试用例；观察登录/刷新请求的日志与错误率；确保 HTTPS 与 `secure=True`。
   - 上线时同时发布前后端改动，或采用兼容策略（后端先返回旧行为并支持新 refresh 接口，前端再启用），以便回滚到老版本。

4. 监控指标
   - 登录成功率、刷新失败率、401 异常数、平均会话时长、被动登出次数。

---

## 五、逐步实施建议（迭代）

1. 第一步（快速可交付）
   - 后端：配置 SimpleJWT，添加 `login` 与 `refresh` 接口（最小实现），并设置 refresh cookie。
   - 前端：在 `src/utils/request/index.ts` 添加拦截器（上文示例），启用 `withCredentials: true`，并完成 `get/set access token` 与 `logoutAndRedirect` 的最小实现。

2. 第二步（增强安全）
   - 启用 `ROTATE_REFRESH_TOKENS` 与黑名单；实现 `logout` 撤销逻辑。
   - 在刷新接口中加入对自定义 header 或 CSRF token 的校验。

3. 第三步（体验优化）
   - 实现用户活动检测与静默刷新、到期前提示弹窗。
   - 完善日志、监控与运维手册。

---

## 六、测试用例清单（快速参考）

- 登录后访问受保护接口成功。
- Access 到期后能静默刷新并自动重试原始请求。
- 多个并发 401 请求只触发一次刷新。
- 刷新失败后清理状态并跳转登录。
- 登出后 refresh 被撤销且后续刷新失败。
- 非同源请求或缺少自定义 header 时刷新接口拒绝（若启用自定义 header 防 CSRF）。

---

## 七、附录：变更文件建议

- `settings.py`（SIMPLE_JWT + INSTALLED_APPS）
- 新增/修改 `apps/auth/views.py`, `apps/auth/urls.py`
- 前端：`src/utils/request/index.ts`、`src/utils/auth.ts`（存取 token、登出方法）、入口注册用户活动监听（例如 `src/main.ts`）

---

如需，我可以继续：
- 1) 在后端为你生成完整示例文件 `views.py` / `urls.py` 并提交补丁；
- 2) 直接修改并提交前端 `src/utils/request/index.ts` 的拦截器实现并运行本地测试。

请告诉我接下来要先做哪一步。