import type { IconFormType, IconItemType } from '@/api/resource/icon/type.ts';
import type { CategoryFormType, CategoryItemType } from '@/api/resource/type';
import type { FormDialogProps } from '@/types/type';

export const categoryColumnList = [
  { title: '名称', prop: 'name' },
  { title: '英文名', prop: 'value' },
  { title: '排序', prop: 'sort' },
  { title: '创建时间', prop: 'createTime' },
];

export const originalForm: IconFormType = {
  name: '',
  url: '',
  sort: 0,
  desc: '',
  source: 'iconpark',
  category: '',
};

export const formRules = {
  name: [{ required: true, trigger: 'change', message: '请输入图标名称' }],
  url: [{ required: true, trigger: 'change', message: '请上传图标文件' }],
  source: [{ required: true, trigger: 'change', message: '请输入图标来源' }],
  sort: [{ required: true, trigger: 'change', message: '请输入图标排序' }],
  category: [{ required: true, trigger: 'change', message: '请选择图标类型' }],
};

export type FormDialogPropsType = FormDialogProps<IconItemType> & {
  categoryList: CategoryItemType[];
};

export const categoryOriginalForm: CategoryFormType = {
  name: '',
  sort: 0,
  value: '',
};

export const categoryFormRules = {
  name: [{ required: true, trigger: 'change', message: '请输入名称' }],
  value: [{ required: true, trigger: 'change', message: '请输入英文名' }],
  sort: [{ required: true, trigger: 'change', message: '请输入排序' }],
};

export type CategoryDialogPropsType = FormDialogProps<CategoryItemType>;
