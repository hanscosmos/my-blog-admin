import {
  ImageFormType,
  ImageIdType,
  ImageItemType,
  ImageSearchType,
} from './type';
import request from '@/utils/request';
import {
  CategoryFormType,
  CategoryIdType,
  CategoryItemType,
} from '@/api/resource/type.ts';
export const addImageApi = (data: ImageFormType) =>
  request.post<boolean>('/resource/image/add', data);

export const editImageApi = (data: ImageFormType & ImageIdType) =>
  request.post<boolean>('/resource/image/edit', data);

export const deleteImageApi = (data: IdsType) =>
  request.post<boolean>('/resource/image/delete', data);

export const getImageListApi = (data: ImageSearchType) =>
  request.post<ResPageType<ImageItemType>>('/resource/image/list', data);

export const addImageCategoryApi = (data: CategoryFormType) =>
  request.post<boolean>('/resource/image/category/add', data);

export const editImageCategoryApi = (data: CategoryFormType & CategoryIdType) =>
  request.post<boolean>('/resource/image/category/edit', data);

export const deleteImageCategoryApi = (data: IdsType) =>
  request.post<boolean>('/resource/image/category/delete', data);

export const getImageCategoryListApi = () =>
  request.post<CategoryItemType[]>('/resource/image/category/list');

export default {
  addImageApi,
  editImageApi,
  deleteImageApi,
  getImageListApi,
  addImageCategoryApi,
  editImageCategoryApi,
  deleteImageCategoryApi,
  getImageCategoryListApi,
};
