import {
  ArticleColumnFormType,
  ArticleColumnItemType,
  SearchArticleColumnType,
} from './type';
import request from '@/utils/request';
export const addArticleColumnApi = (data: ArticleColumnFormType) =>
  request.post<boolean>('/article/column/add', data);

export const editArticleColumnApi = (data: ArticleColumnItemType) =>
  request.post<boolean>('/article/column/edit', data);

export const deleteArticleColumnApi = (data: IdsType) =>
  request.post<boolean>('/article/column/delete', data);

export const getArticleColumnListApi = (
  data: PageType & SearchArticleColumnType
) =>
  request.post<ResPageType<ArticleColumnItemType>>(
    '/article/column/list',
    data
  );
