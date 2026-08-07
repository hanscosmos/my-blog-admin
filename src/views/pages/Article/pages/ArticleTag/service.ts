import type {
  ArticleTagFormType,
  ArticleTagItemType,
} from '@/api/article/tag/type.ts';
import type { FormDialogProps } from '@/types/type.ts';
import dayjs from 'dayjs';

export const originalForm: ArticleTagFormType = {
  name: '',
  alias: '',
  color: '',
  sort: 0,
  description: '',
};

export const columnList = [
  { title: '名称', prop: 'name' },
  { title: '别名', prop: 'alias' },
  { title: '排序', prop: 'sort' },
  { title: '创建时间', prop: 'createTime' },
];

export const formRules = {
  name: [{ required: true, trigger: 'change', message: '请输入文章标签名称' }],
  alias: [{ required: true, trigger: 'change', message: '请输入文章标签别名' }],
};

export const fmtResData = (arr: ArticleTagItemType[]) => {
  return arr.map((item) => ({
    ...item,
    createTime: dayjs(item.createTime).format('YYYY-MM-DD HH:mm:ss'),
  }));
};

export type FormDialogPropsType = FormDialogProps<ArticleTagItemType | null>;
