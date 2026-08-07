import { DictFormType, DictItemType, type DictSimpleItemType } from './type';
import request from '@/utils/request';
export const addDictApi = (data: DictFormType) =>
  request.post<boolean>('/sys/dict/add', data);

export const editDictApi = (data: DictFormType & { id: string }) =>
  request.post<boolean>('/sys/dict/edit', data);

export const deleteDictApi = (data: IdsType) =>
  request.post<boolean>('/sys/dict/delete', data);

export const changeDictStatusApi = (data: { id: string; status: boolean }) =>
  request.post<boolean>('/sys/dict/change/status', data);

export const getDictListApi = (data: { code: string }) =>
  request.post<DictItemType[]>('/sys/dict/list', data);

export const getAvailableDictListApi = (data: { code: string }) =>
  request.post<DictSimpleItemType[]>('/sys/dict/list/code', data);
