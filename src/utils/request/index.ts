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
      (res: AxiosResponse) => {
        // 直接返回res，当然你也可以只返回res.data
        if (res.data.code === 401) {
          const { clearUserData } = useUserInfoStore();
          clearUserData();
          setSessionStorage('tokenValid', true);
          location.replace('/login');
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
            // 这里可以做清空storage并跳转到登录页的操作
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
