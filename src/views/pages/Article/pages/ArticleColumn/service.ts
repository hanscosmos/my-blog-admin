import type {
  ArticleColumnFormType,
  ArticleColumnItemType,
} from '@/api/article/column/type.ts';
import type { FormDialogProps } from '@/types/type.ts';
import dayjs from 'dayjs';

export const originalForm: ArticleColumnFormType = {
  name: '',
  cover: '',
  sort: 0,
  description: '',
};

export const columnList = [
  { title: '名称', prop: 'name' },
  { title: '排序', prop: 'sort' },
  { title: '创建时间', prop: 'createTime' },
];

export const formRules = {
  name: [{ required: true, trigger: 'change', message: '请输入文章标签名称' }],
  cover: [{ required: true, trigger: 'change', message: '请上传文章专栏封面' }],
};

export const fmtResData = (arr: ArticleColumnItemType[]) => {
  return arr.map((item) => ({
    ...item,
    createTime: dayjs(item.createTime).format('YYYY-MM-DD HH:mm:ss'),
  }));
};

export type FormDialogPropsType = FormDialogProps<ArticleColumnItemType | null>;
