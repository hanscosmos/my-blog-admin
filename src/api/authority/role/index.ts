import type { MenuItemType } from '../menu/type';
import { RoleFormType, RoleItemType } from './type';
import request from '@/utils/request';
export const addRoleApi = (data: RoleFormType) =>
  request.post<boolean>('/authority/role/add', data);

export const editRoleApi = (data: RoleItemType) =>
  request.post<boolean>('/authority/role/edit', data);

export const deleteRoleApi = (data: IdsType) =>
  request.post<boolean>('/authority/role/delete', data);

export const getRoleListApi = () =>
  request.get<RoleItemType[]>('/authority/role/list');

export const setRoleMenuApi = (data: { roleId: string; menuIds: string[] }) =>
  request.post('/authority/role/set/menu', data);

export const getMenuListByRoleIdApi = (params: IdType) =>
  request.get('/authority/role/menu/list', { params });

export const getMenuTreeByRoleIdApi = (data: IdType) =>
  request.post<MenuItemType[]>('/authority/role/menu/tree', data);

export const setRoleInterfaceApi = (data: {
  roleId: string;
  apiIds: string[];
}) => request.post('/authority/role/set/api', data);

export const getInterfaceListByRoleIdApi = (params: IdType) =>
  request.get('/authority/role/api/list', { params });
