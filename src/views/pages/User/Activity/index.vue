<template>
  <div class="user-task flex flex-col wh-full">
    <div class="content-wrapper flex-1 h-0 overflow-auto">
      <AppInfiniteList :loading="loading" :items="dataList" :finished="dataList.length === total"
        @load-more="loadMoreHandler">
        <template #item="{ item }">
          <div class="activity-item px-4 py-4">
            <!-- 动作头部 -->
            <div class="flex items-center mb-3">
              <AppIcon :name="activityMeta(item.targetType).icon" :size="16"
                :color="activityMeta(item.targetType).color" class="mr-2" />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-200">
                {{ activityMeta(item.targetType).label }}
              </span>
              <span class="ml-auto text-xs text-gray-400">{{ dateDiff(item.createTime) }}前</span>
            </div>

            <!-- 文章类：信息卡片 -->
            <template v-if="isArticleType(item.targetType)">
              <div v-if="item.article" class="article-card wrapper-item flex p-3 cursor-pointer hover-border"
                @click="gotoView(item)">
                <img :src="item.article.cover || fallbackCover(item.article.status)" :alt="item.article.title"
                  class="w-24 h-16 object-cover rounded flex-shrink-0" />
                <div class="ml-3 flex-1 min-w-0">
                  <div class="flex items-center mb-1">
                    <AppTag size="small" :name="item.article.status === 'draft' ? '草稿' : '正文'"
                      :color="item.article.status === 'draft' ? 'gray' : ''"></AppTag>
                    <span class="ml-2 text-sm font-medium text-gray-800 dark:text-white truncate"
                      :title="item.article.title">{{ item.article.title }}</span>
                  </div>
                  <p v-if="item.article.abstract" class="text-xs text-gray-500 leading-5 line-clamp-2">
                    {{ item.article.abstract }}
                  </p>
                  <p v-else class="text-xs text-gray-400 leading-5">暂无摘要</p>
                  <div class="flex items-center mt-1 text-xs text-gray-400">
                    <span v-if="item.article.category" class="mr-3">{{ item.article.category }}</span>
                    <span>{{ fmtTime(item.article.createTime, 'YYYY-MM-DD') }}</span>
                  </div>
                </div>
              </div>
              <div v-else class="wrapper-item px-3 py-3 text-sm text-gray-400">{{ deletedText(item) }}</div>
            </template>

            <!-- 事项类：单行文本 -->
            <div v-else class="text-sm text-gray-500">
              {{ item.action }}《{{ item.extraData?.title || '' }}》
            </div>
          </div>
        </template>
      </AppInfiniteList>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { getUserActivityApi } from '@/api/user';
import { useSearch } from '@/hooks/useSearch';
import { IActivityItem } from '@/types/user';
import ArticleDraftImg from '@/assets/image/draft.jpg';
import ArticleImg from '@/assets/image/cover.webp';

const router = useRouter();

const ARTICLE_TYPES = ['publish_article', 'create_draft', 'update_article', 'delete_article'];

const activityMetaMap: Record<string, { label: string; icon: string; color: string }> = {
  publish_article: { label: '发表了文章', icon: 'send', color: '#136ddc' },
  create_draft: { label: '创建了草稿', icon: 'file-editing', color: '#8a919f' },
  update_article: { label: '更新了文章', icon: 'edit', color: '#1e9e6a' },
  delete_article: { label: '删除了文章', icon: 'delete', color: '#e5484d' },
  create_task: { label: '创建了事项', icon: 'add', color: '#1e9e6a' },
  complete_task: { label: '完成了事项', icon: 'check', color: '#136ddc' },
};

const activityMeta = (type: string) =>
  activityMetaMap[type] || { label: '动态', icon: 'file', color: '#8a919f' };

const isArticleType = (type: string) => ARTICLE_TYPES.includes(type);

const fallbackCover = (status: string) => (status === 'publish' ? ArticleImg : ArticleDraftImg);

const deletedText = (item: IActivityItem) => {
  const title = item.extraData?.title ? `《${item.extraData.title}》` : '';
  return item.targetType === 'delete_article' ? `已删除${title}` : `文章或草稿已删除${title}`;
};

const gotoView = (item: IActivityItem) => {
  if (!item.article) return;
  const id = item.article.id;
  if (item.article.status === 'draft') {
    router.push({ name: 'UpdateArticle', query: { id } });
  } else {
    router.push({ name: 'ArticleDetail', query: { id } });
  }
};

const {
  pageConfig,
  loading,
  dataList,
  getDataListHandler,
  total,
  initDataListHandler,
} = useSearch<object, IActivityItem>({}, getUserActivityApi, 20, true);

const loadMoreHandler = () => {
  pageConfig.pageNumber += 1;
  getDataListHandler();
};

onMounted(() => {
  initDataListHandler();
});

// 向个人中心上报动态总数
const updateTabCount = inject<(key: string, count: number) => void>('updateTabCount', () => { });
watch(total, (val) => {
  updateTabCount('dynamic', val);
});
</script>
<style lang="scss" scoped></style>
