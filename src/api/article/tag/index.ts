import {
  ArticleTagFormType,
  ArticleTagItemType,
  SearchArticleTagType,
} from './type';
import request from '@/utils/request';
export const addArticleTagApi = (data: ArticleTagFormType) =>
  request.post<boolean>('/article/tag/add', data);

export const editArticleTagApi = (data: ArticleTagItemType) =>
  request.post<boolean>('/article/tag/edit', data);

export const deleteArticleTagApi = (data: IdsType) =>
  request.post<boolean>('/article/tag/delete', data);

export const getArticleTagListApi = (data: PageType & SearchArticleTagType) =>
  request.post<ResPageType<ArticleTagItemType>>('/article/tag/list', data);
