import type { ArticleTagItemType } from '@/api/article/tag/type.ts';
import dayjs from 'dayjs';

export const columnList = [{ title: '文章标题', prop: 'title' }];

export const fmtResData = (arr: ArticleTagItemType[]) => {
  return arr.map((item) => ({
    ...item,
    createTime: dayjs(item.createTime).format('YYYY-MM-DD HH:mm:ss'),
  }));
};
