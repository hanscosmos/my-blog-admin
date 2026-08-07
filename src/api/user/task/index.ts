import { UserTaskFormType, UserTaskItemType, UserTaskSearchType } from './type';
import request from '@/utils/request';
export const addUserTaskApi = (data: UserTaskFormType) =>
  request.post<boolean>('/user/task/add', data);

export const editUserTaskApi = (data: UserTaskFormType & IdType) =>
  request.post<boolean>('/user/task/update', data);

export const deleteUserTaskApi = (data: IdsType) =>
  request.post<boolean>('/user/task/delete', data);

export const getUserTaskListApi = (data: PageType & UserTaskSearchType) =>
  request.post<ResPageType<UserTaskItemType>>('/user/task/list', data);

export const getUserTaskPanelListApi = (data: {
  startTime: string;
  endTime: string;
}) => request.post<UserTaskItemType[]>('/user/task/panel/list', data);

export const getUserRecentTaskListApi = () =>
  request.post<UserTaskItemType[]>('/user/task/recent/list');

export const getUserTaskScoreStatApi = (data: {
  rangeType: string;
  startDate?: string;
  endDate?: string;
}) => request.post<any[]>('/user/task/score/stat', data);
