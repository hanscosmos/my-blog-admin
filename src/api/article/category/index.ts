import { ArticleCategoryFormType, ArticleCategoryItemType } from './type';
import request from '@/utils/request';
export const addArticleCategoryApi = (data: ArticleCategoryFormType) =>
  request.post<boolean>('/article/category/add', data);

export const editArticleCategoryApi = (data: ArticleCategoryItemType) =>
  request.post<boolean>('/article/category/edit', data);

export const deleteArticleCategoryApi = (data: IdsType) =>
  request.post<boolean>('/article/category/delete', data);

export const getAllArticleCategoryTreeApi = () =>
  request.get<ArticleCategoryItemType[]>('/article/category/tree');
