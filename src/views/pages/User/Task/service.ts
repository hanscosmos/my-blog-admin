import type { UserTaskFormType, UserTaskItemType } from '@/api/user/task/type';
import type { FormDialogProps } from '@/types/type.ts';
import dayjs from 'dayjs';

export const originalForm: UserTaskFormType = {
  title: '',
  tags: [],
  description: '',
  priority: '',
  status: '',
  deadline: '',
  startTime: '',
  endTime: '',
  importance: 0,
  urgency: 0,
  growth: 0,
  happiness: 0,
  negative: 0,
};

export const columnList = [
  { title: '名称', prop: 'title' },
  { title: '截止日期', prop: 'deadline' },
];

export const formRules = {
  title: [{ required: true, trigger: 'change', message: '请输入事项名称' }],
  priority: [
    { required: true, trigger: 'change', message: '请选择事项优先级' },
  ],
  status: [{ required: true, trigger: 'change', message: '请选择事项状态' }],
  deadline: [{ required: true, trigger: 'change', message: '请选择截止时间' }],
};

export const fmtResData = (arr: UserTaskItemType[]) => {
  return arr.map((item) => ({
    ...item,
    createTime: dayjs(item.createTime).format('YYYY-MM-DD HH:mm:ss'),
  }));
};

export type FormDialogPropsType = FormDialogProps<UserTaskItemType | null>;
