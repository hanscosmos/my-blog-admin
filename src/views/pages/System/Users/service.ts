import type { UserFormType, UserItemType } from '@/api/system/user/type.ts';
import type { FormDialogProps } from '@/types/type.ts';

export const originalForm: UserFormType = {
  username: '',
  nickName: '',
  roleIds: [],
  email: '',
};

export const columnList = [{ title: '昵称', prop: 'nickName' }];

export const formRules = {
  username: [{ required: true, trigger: 'change', message: '请输入用户名' }],
  nickName: [{ required: true, trigger: 'change', message: '请输入用户昵称' }],
  email: [{ required: true, trigger: 'change', message: '请输入用户用户邮箱' }],
  roleIds: [{ required: true, trigger: 'change', message: '请选择用户角色' }],
};

export type FormDialogPropsType = FormDialogProps<UserItemType | null>;
