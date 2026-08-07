<template>
  <div class="my-article flex flex-col wh-full">
    <div
      class="header-wrapper flex items-center justify-between px-4 pb-4 border-bottom"
    >
      <span class="font-bold">我的创作（{{ total }}）</span>
      <el-segmented v-model="currentLayout" :options="options">
        <template #default="{ item }">
          <div class="xy-center">
            <my-icon :name="(item as any).icon" size="16"> </my-icon>
          </div>
        </template>
      </el-segmented>
    </div>
    <div v-loading="loading" class="flex-1 h-0 p-4 overflow-auto">
      <div v-if="currentLayout === 'list'" class="flex flex-col">
        <div
          class="article-item-wrapper border-bottom"
          v-for="item in articleList"
          :key="item.id"
        >
          <ArticleListItem
            :article="item"
            @delete="deleteArticleHandler"
            @edit="gotoUpdateArticle"
            @view="gotoArticleDetail"
          ></ArticleListItem>
        </div>
      </div>
      <ul v-else class="article-list-wrapper">
        <li
          class="article-item-wrapper"
          v-for="item in articleList"
          :key="item.id"
        >
          <ArticleCard
            :article="item"
            @delete="deleteArticleHandler"
            @edit="gotoUpdateArticle"
            @view="gotoArticleDetail"
          ></ArticleCard>
        </li>
      </ul>
    </div>
    <div class="footer-wrapper flex-center p-4">
      <MyPagination
        :total="total"
        :page-number="pageConfig.pageNumber"
        :page-size="pageConfig.pageSize"
        @page-change="pageChangeHandler"
      ></MyPagination>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { deleteArticleApi } from '@/api/article';
import type { ArticleListItemType } from '@/api/article/type';
import { getUserArticleListApi } from '@/api/user';
import { useSearch } from '@/hooks/useSearch';
import ArticleCard from '@/views/pages/Article/pages/ArticleList/components/ArticleCard.vue';
import ArticleListItem from './components/ArticleListItem.vue';

const router = useRouter();
const currentLayout = ref('list');
const options = [
  {
    label: '列表',
    value: 'list',
    icon: 'view-grid-list',
  },
  {
    label: '卡片',
    value: 'card',
    icon: 'view-grid-card',
  },
];

const originalParams = { title: '' };

const {
  dataList,
  loading,
  total,
  pageConfig,
  pageChangeHandler,
  initDataListHandler,
} = useSearch<{ title: string }, ArticleListItemType>(
  originalParams,
  getUserArticleListApi
);

const articleList = computed(() => {
  return dataList.value.map((item: any) => {
    const articleItem: ArticleListItemType = {
      id: item.id,
      title: item.title,
      abstract: item.abstract,
      cover: item.cover,
      author: item.author.name,
      authorId: item.author.id,
      authorAvatar: item.author.avatar,
      status: item.status,
      category: item.category
        ? item.category.father + '·' + item.category.name
        : '',
      createTime: fmtTime(item.createTime, 'YYYY-MM-DD'),
      updateTime: fmtTime(item.updateTime),
    };
    return articleItem;
  });
});

const deleteArticleHandler = (id: string) => {
  confirmHandler('您将和删除这篇文章', async () => {
    const res = await deleteArticleApi(id);
    if (res) {
      ElMessage.success('删除成功');
      await initDataListHandler();
    }
  });
};

const gotoArticleDetail = (id: string) => {
  router.push({
    name: 'ArticleDetail',
    query: { id },
  });
};

const gotoUpdateArticle = (id: string) => {
  router.push({
    name: 'UpdateArticle',
    query: { id },
  });
};

onMounted(() => {
  initDataListHandler();
});
</script>
<style lang="scss" scoped>
.article-list-wrapper {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  align-content: start;
  gap: 1rem;
}
</style>
