import { getAllArticleCategoryTreeApi } from '@/api/article/category';
import type { ArticleCategoryItemType } from '@/api/article/category/type';
import { getArticleColumnListApi } from '@/api/article/column';
import type { ArticleColumnItemType } from '@/api/article/column/type';
import { getArticleTagListApi } from '@/api/article/tag';
import type { ArticleTagItemType } from '@/api/article/tag/type';
import dayjs from 'dayjs';

function fmtResData(arr: ArticleCategoryItemType[]) {
  return arr.map((item) => ({
    ...item,
    createTime: dayjs(item.createTime).format('YYYY-MM-DD HH:mm:ss'),
    children: item.children?.map((el) => ({
      ...el,
      createTime: dayjs(el.createTime).format('YYYY-MM-DD HH:mm:ss'),
    })),
  }));
}

export const useArticleCategory = () => {
  const categoryList = ref<ArticleCategoryItemType[]>([]);
  const loading = ref(true);
  const getCategoryTree = async () => {
    try {
      loading.value = true;
      const res = await getAllArticleCategoryTreeApi();
      categoryList.value = fmtResData(res.data);
    } catch (error) {
      categoryList.value = [];
      console.log(error);
    } finally {
      loading.value = false;
    }
  };
  return { categoryList, loading, getCategoryTree };
};

export const useArticleTag = () => {
  const tagList = ref<ArticleTagItemType[]>([]);
  const getTagList = async () => {
    try {
      const res = await getArticleTagListApi({
        pageNumber: 1,
        pageSize: 1000,
        name: '',
      });
      tagList.value = res.data.result;
    } catch (error) {
      tagList.value = [];
      console.log(error);
    }
  };
  return { tagList, getTagList };
};

export const useArticleColumn = () => {
  const columnList = ref<ArticleColumnItemType[]>([]);
  const getColumnList = async () => {
    try {
      const res = await getArticleColumnListApi({
        pageNumber: 1,
        pageSize: 1000,
        name: '',
      });
      columnList.value = res.data.result;
    } catch (error) {
      columnList.value = [];
      console.log(error);
    }
  };
  return { columnList, getColumnList };
};
