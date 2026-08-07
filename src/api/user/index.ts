import type { ArticleListItemType } from '../article/type';
import { UserFormType, type UserInfoType } from './type';
import request from '@/utils/request';
export const getUserProfileApi = (data = {}) =>
  request.post<UserInfoType>('/user/get/self', data);

export const updateUserProfileApi = (data: UserFormType) =>
  request.post<boolean>('/user/update/self', data);

export const getUserActivityApi = (data: PageType) =>
  request.post('/user/activity/list', data);

export const getUserArticleListApi = (data: { title: string } & PageType) =>
  request.post<ResPageType<ArticleListItemType>>('/user/article/list', data);
