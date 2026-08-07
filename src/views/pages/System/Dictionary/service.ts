import type { DictFormType, DictItemType } from '@/api/system/dict/type.ts';
import type { FormDialogProps } from '@/types/type.ts';

export const originalForm: DictFormType = {
  desc: '',
  code: '',
  sort: 0,
  key: '',
  value: '',
};

export const columnList = [
  { title: '字典键', prop: 'key' },
  { title: '字典值', prop: 'value' },
  { title: '字典码', prop: 'code' },
  { title: '排序', prop: 'sort' },
  { title: '创建时间', prop: 'createTime' },
  { title: '更新时间', prop: 'updateTime' },
];

export const formRules = {
  key: [{ required: true, trigger: 'change', message: '请输入字典键' }],
  code: [{ required: true, trigger: 'change', message: '请输入字典码' }],
  value: [{ required: true, trigger: 'change', message: '请输入字典值' }],
};

export type FormDialogPropsType = FormDialogProps<DictItemType | null> & {
  currentCode: string;
};
