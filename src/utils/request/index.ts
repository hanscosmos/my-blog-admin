// index.ts
import axios from 'axios';
import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { setSessionStorage } from '../storage';
import { storeToRefs } from 'pinia';
import { useUserInfoStore } from '@/store/user';
import { getCookie } from '@/utils/tool';
import { ElMessage } from 'element-plus';

// 刷新 token 的状态管理（模块级变量，全局共享）
let isRefreshing = false;
let subscribers: Array<(token: string) => void> = [];

function onRefreshed(newToken: string) {
  subscribers.forEach((cb) => cb(newToken));
  subscribers = [];
}

function addSubscriber(cb: (token: string) => void) {
  subscribers.push(cb);
}

class Request {
  // axios 实例
  instance: AxiosInstance;
  // 基础配置，url和超时时间
  baseConfig: AxiosRequestConfig = { baseURL: '/backapi', timeout: 60000 };

  constructor(type: 'base' | 'other', baseUrl?: string) {
    if (baseUrl) this.baseConfig.baseURL = baseUrl;
    // 使用axios.create创建axios实例
    this.instance = axios.create(this.baseConfig);

    const { token } = storeToRefs(useUserInfoStore());
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (token.value) {
          if (config.headers) {
            config.headers.Authorization = `${token.value}`;
            config.headers['X-CSRFToken'] = `${getCookie('csrftoken')}`;
          }
        }

        return config;
      },
      (err: any) => {
        return Promise.reject(err);
      }
    );

    this.instance.interceptors.response.use(
      async (res: AxiosResponse) => {
        // 直接返回res，当然你也可以只返回res.data
        if (res.data.code === 401) {
          const store = useUserInfoStore();
          const originalRequest = res.config as any;

          // 以下情况不尝试刷新，直接跳转登录：
          // 1. 登录接口本身返回 401
          // 2. refresh 接口本身返回 401（refresh token 也过期了）
          // 3. 已经重试过的请求再次 401（防止死循环）
          if (
            originalRequest.url === '/user/login' ||
            originalRequest.url === '/user/refresh' ||
            originalRequest._isRetry
          ) {
            store.clearUserData();
            setSessionStorage('tokenValid', true);
            location.replace('/login');
            return Promise.reject(res);
          }

          // 没有 refreshToken 可用，直接登出
          if (!store.refreshToken) {
            store.clearUserData();
            setSessionStorage('tokenValid', true);
            location.replace('/login');
            return Promise.reject(res);
          }

          // 如果正在刷新中，把当前请求加入等待队列
          if (isRefreshing) {
            return new Promise((resolve) => {
              addSubscriber((newToken: string) => {
                originalRequest.headers.Authorization = newToken;
                originalRequest._isRetry = true;
                resolve(this.instance(originalRequest));
              });
            });
          }

          // 发起刷新请求
          isRefreshing = true;

          try {
            const refreshRes: any = await this.instance.post('/user/refresh', {
              refreshToken: store.refreshToken,
            });

            if (refreshRes.code === 0 && refreshRes.data?.token) {
              const newToken = refreshRes.data.token;
              // 更新 store 中的 access token
              store.token = newToken;
              // 通知所有等待中的请求
              onRefreshed(newToken);
              // 重试当前请求
              originalRequest.headers.Authorization = newToken;
              originalRequest._isRetry = true;
              return this.instance(originalRequest);
            } else {
              // refresh 接口返回非 0 code（但不应该是 401，因为上面已经判断过了）
              store.clearUserData();
              setSessionStorage('tokenValid', true);
              location.replace('/login');
              return Promise.reject(res);
            }
          } catch (err) {
            // 网络错误等异常
            store.clearUserData();
            setSessionStorage('tokenValid', true);
            location.replace('/login');
            return Promise.reject(err);
          } finally {
            isRefreshing = false;
          }
        }
        if (res.data.code === 501) {
          console.log(res.data.data);
        }
        if (res.data.code && res.data.code !== 401) {
          ElMessage.error(res.data.msg || res.data.message);
        }
        return type === 'base' ? res.data : res;
      },
      (err: any) => {
        // 这里用来处理http常见错误，进行全局提示
        let message = '';
        switch (err.response.status) {
          case 400:
            message = '请求错误(400)';
            break;
          case 401:
            message = '未授权，请重新登录(401)';
            // 清空storage并跳转到登录页
            const store = useUserInfoStore();
            store.clearUserData();
            setSessionStorage('tokenValid', true);
            location.replace('/login');
            break;
          case 403:
            message = '拒绝访问(403)';
            break;
          case 404:
            message = '请求出错(404)';
            break;
          case 408:
            message = '请求超时(408)';
            break;
          case 500:
            message = '服务器错误(500)';
            break;
          case 501:
            message = '服务未实现(501)';
            break;
          case 502:
            message = '网络错误(502)';
            break;
          case 503:
            message = '服务不可用(503)';
            break;
          case 504:
            message = '网络超时(504)';
            break;
          case 505:
            message = 'HTTP版本不受支持(505)';
            break;
          default:
            message = `连接出错(${err.response.status})!`;
        }
        // 这里错误消息可以使用全局弹框展示出来
        ElMessage.error(message);
        // 这里是AxiosError类型，所以一般我们只reject我们需要的响应即可
        return Promise.reject(err.response);
      }
    );
  }

  // 定义请求方法
  public request<T = any>(config: AxiosRequestConfig): Promise<ResType<T>> {
    return this.instance.request(config);
  }

  public get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ResType<T>> {
    return this.instance.get(url, config);
  }

  public post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ResType<T>> {
    return this.instance.post(url, data, config);
  }

  public put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ResType<T>> {
    return this.instance.put(url, data, config);
  }

  public delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ResType<T>> {
    return this.instance.delete(url, config);
  }
}

const request = new Request('base');

export default request;
