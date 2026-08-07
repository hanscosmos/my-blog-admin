import request from '@/utils/request';
import { ApiFormType, ApiIdType, type ApiItemType } from './type';

export const getInterfaceListApi = (
  data: PageType & {
    param: { module: string; name?: string };
  }
) => request.post<ResPageType<ApiItemType>>('/authority/api/list', data);

export const addInterfaceApi = (data: ApiFormType) =>
  request.post<boolean>('/authority/api/add', data);

export const batchAddInterfaceApi = (data: { apis: ApiFormType[] }) =>
  request.post<boolean>('/authority/api/batch/add', data);

export const updateInterfaceApi = (data: ApiIdType & ApiFormType) =>
  request.post<boolean>('/authority/api/update', data);

export const deleteInterfaceApi = (data: ApiIdType) =>
  request.post<boolean>('/authority/api/delete', data);

export const deleteInterfacesApi = (data: { ids: string[] }) =>
  request.post<boolean>('/authority/api/delete/ids', data);
