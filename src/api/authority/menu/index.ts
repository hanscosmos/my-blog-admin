import { MenuFormType, MenuItemType } from './type';
import request from '@/utils/request';
export const addMenuApi = (data: MenuFormType) =>
  request.post<boolean>('/authority/menu/add', data);

export const editMenuApi = (data: MenuItemType) =>
  request.post<boolean>('/authority/menu/edit', data);

export const deleteMenuApi = (data: IdsType) =>
  request.post<boolean>('/authority/menu/delete', data);

export const getAllMenuTreeApi = () =>
  request.get<MenuItemType[]>('/authority/menu/tree/all');

export const getNavMenuTreeApi = () =>
  request.post<MenuItemType[]>('/authority/menu/tree/nav');
