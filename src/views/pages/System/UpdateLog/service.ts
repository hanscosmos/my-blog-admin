import type { DictSimpleItemType } from '@/api/system/dict/type';
import type {
  UpdateLogFormType,
  UpdateLogItemType,
} from '@/api/system/updateLog/type';
import type { FormDialogProps } from '@/types/type.ts';

export const originalForm: UpdateLogFormType = {
  summary: '',
  version: '',
  plannedReleaseDate: '',
  actualReleaseDate: '',
  details: '',
  releasedType: '',
  status: '',
  isCurrentVersion: false,
};

export const columnList = [
  { title: '日志概要', prop: 'summary' },
  { title: '系统版本', prop: 'version' },
  { title: '计划发布日期', prop: 'plannedReleaseDate' },
  { title: '实际发布日期', prop: 'actualReleaseDate' },
];

export const formRules: Partial<Record<keyof UpdateLogFormType, any>> = {
  summary: [{ required: true, trigger: 'change', message: '请输入日志概要' }],
  version: [{ required: true, trigger: 'change', message: '请输入系统版本' }],
  releasedType: [
    { required: true, trigger: 'change', message: '请选择发布类型' },
  ],
  status: [{ required: true, trigger: 'change', message: '请选择状态' }],
};

export type FormDialogPropsType = FormDialogProps<UpdateLogItemType | null> & {
  statusList: DictSimpleItemType[];
  releasedTypeList: DictSimpleItemType[];
};
