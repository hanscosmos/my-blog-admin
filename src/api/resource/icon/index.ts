import { IconFormType, IconIdType, IconItemType, IconSearchType } from './type';
import request from '@/utils/request';
import {
  CategoryFormType,
  CategoryIdType,
  CategoryItemType,
} from '@/api/resource/type.ts';
export const addIconApi = (data: IconFormType) =>
  request.post<boolean>('/resource/icon/add', data);

export const editIconApi = (data: IconFormType & IconIdType) =>
  request.post<boolean>('/resource/icon/edit', data);

export const deleteIconApi = (data: IdsType) =>
  request.post<boolean>('/resource/icon/delete', data);

export const getIconListApi = (data: IconSearchType & PageType) =>
  request.post<ResPageType<IconItemType>>('/resource/icon/list', data);

export const addIconCategoryApi = (data: CategoryFormType) =>
  request.post<boolean>('/resource/icon/category/add', data);

export const editIconCategoryApi = (data: CategoryFormType & CategoryIdType) =>
  request.post<boolean>('/resource/icon/category/edit', data);

export const deleteIconCategoryApi = (data: IdsType) =>
  request.post<boolean>('/resource/icon/category/delete', data);

export const getIconCategoryListApi = () =>
  request.get<CategoryItemType[]>('/resource/icon/category/list');

export default {
  addIconApi,
  editIconApi,
  deleteIconApi,
  getIconListApi,
  addIconCategoryApi,
  editIconCategoryApi,
  deleteIconCategoryApi,
  getIconCategoryListApi,
};
