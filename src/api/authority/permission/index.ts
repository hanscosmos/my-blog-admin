import request from '@/utils/request';
import type { SelfPermissionType } from './type';

export const getSelfPermissionApi = () =>
  request.get<SelfPermissionType>('/authority/permission/self');
