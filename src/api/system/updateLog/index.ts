import { UpdateLogFormType, UpdateLogItemType } from './type';
import request from '@/utils/request';
export const addUpdateLogApi = (data: UpdateLogFormType) =>
  request.post<boolean>('/sys/updateLog/add', data);

export const editUpdateLogApi = (data: UpdateLogFormType & { id: string }) =>
  request.post<boolean>('/sys/updateLog/edit', data);

export const deleteUpdateLogApi = (data: IdsType) =>
  request.post<boolean>('/sys/updateLog/delete', data);

export const getUpdateLogListApi = (data: PageType) =>
  request.post<ResPageType<UpdateLogItemType>>('/sys/updateLog/list', data);
