import type {
  ArticleCategoryFormType,
  ArticleCategoryItemType,
} from '@/api/article/category/type.ts';
import type { FormDialogProps } from '@/types/type.ts';
import dayjs from 'dayjs';

export const originalForm: ArticleCategoryFormType = {
  name: '',
  alias: '',
  sort: 0,
  description: '',
  father: null,
};

export const columnList = [
  { title: '名称', prop: 'name' },
  { title: '别名', prop: 'alias' },
  { title: '排序', prop: 'sort' },
  { title: '创建时间', prop: 'createTime' },
];

export const formRules = {
  name: [{ required: true, trigger: 'change', message: '请输入文章分类名称' }],
  alias: [{ required: true, trigger: 'change', message: '请输入文章分类别名' }],
};

export const fmtResData = (arr: ArticleCategoryItemType[]) => {
  return arr.map((item) => ({
    ...item,
    createTime: dayjs(item.createTime).format('YYYY-MM-DD HH:mm:ss'),
    children: item.children?.map((el) => ({
      ...el,
      createTime: dayjs(el.createTime).format('YYYY-MM-DD HH:mm:ss'),
    })),
  }));
};

export type FormDialogPropsType =
  FormDialogProps<ArticleCategoryItemType | null>;
