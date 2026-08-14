import type { UserTaskFormType, UserTaskItemType } from '@/api/user/task/type';
import type { FormDialogProps } from '@/types/type.ts';
import dayjs from 'dayjs';

export const originalForm: UserTaskFormType = {
  title: '',
  tags: [],
  description: '',
  priority: 'medium',
  status: 'todo',
  deadline: '',
  startTime: '',
  endTime: '',
  importance: 3,
  urgency: 3,
  growth: 3,
  happiness: 3,
  negative: 0,
  remindBeforeMinutes: -1,
};

export const remindOptions = [
  { key: -1, value: '不提醒' },
  { key: 0, value: '准时提醒' },
  { key: 5, value: '提前 5 分钟' },
  { key: 15, value: '提前 15 分钟' },
  { key: 30, value: '提前 30 分钟' },
  { key: 60, value: '提前 1 小时' },
  { key: 1440, value: '提前 1 天' },
];

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
