import { RoleFormType, RoleItemType } from './type';
import request from '@/utils/request';
export const addRoleApi = (data: RoleFormType) =>
  request.post<boolean>('/authority/role/add', data);

export const editRoleApi = (data: IdType & RoleFormType) =>
  request.post<boolean>('/authority/role/edit', data);

export const deleteRoleApi = (data: IdsType) =>
  request.post<boolean>('/authority/role/delete', data);

export const getRoleListApi = () =>
  request.get<RoleItemType[]>('/authority/role/list');

export const setRoleMenuApi = (data: { roleId: string; menuIds: string[] }) =>
  request.post<boolean>('/authority/role/set/menu', data);

export const getMenuListByRoleIdApi = (params: IdType) =>
  request.get<{ menuIds: string[] }>('/authority/role/menu/list', { params });
