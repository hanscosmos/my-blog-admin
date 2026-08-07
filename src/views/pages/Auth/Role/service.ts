import type { RoleFormType, RoleItemType } from '@/api/authority/role/type.ts';
import type { FormDialogProps } from '@/types/type.ts';

export const originalForm: RoleFormType = {
  name: '',
  code: '',
  sort: 0,
  limit: 1,
};

export const columnList = [
  { title: '名称', prop: 'name' },
  { title: '角色码', prop: 'code' },
  { title: '排序', prop: 'sort' },
  { title: '人数上限', prop: 'limit' },
];

export const formRules = {
  name: [{ required: true, trigger: 'change', message: '请输入角色名称' }],
  code: [{ required: true, trigger: 'change', message: '请输入角色码' }],
  limit: [{ required: true, trigger: 'change', message: '请输入角色用户上限' }],
};

export type FormDialogPropsType = FormDialogProps<RoleItemType | null>;
