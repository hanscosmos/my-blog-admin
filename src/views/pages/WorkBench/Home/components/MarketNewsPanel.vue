<template>
  <div class="market-news">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
      <el-segmented v-model="category" :options="categoryOptions" size="small" />
      <div class="flex items-center gap-3 text-xs" style="color: var(--sys-text-secondary-color)">
        <span v-if="currentData">更新于 {{ currentData.updateTime }}</span>
        <span v-if="currentData?.stale" class="text-amber-500">数据可能延迟</span>
        <button type="button" class="market-icon-action" title="刷新" :disabled="currentLoading" @click="refresh">
          <AppIcon name="refresh" :size="16" :class="{ 'animate-spin': currentLoading }"></AppIcon>
        </button>
      </div>
    </div>

    <p v-if="currentError" class="text-xs text-amber-500 mb-3">{{ currentError }}</p>

    <el-row v-loading="currentLoading" element-loading-text="更新中..." :gutter="20">
      <el-col :xs="24" :lg="16">
        <template v-if="category === 'hot'">
          <div v-if="!hot && !hotError" class="hot-columns">
            <div v-for="n in 2" :key="n" class="hot-skeleton">
              <el-skeleton animated>
                <template #template>
                  <el-skeleton-item variant="h3" style="width: 40%" />
                  <div v-for="i in 8" :key="i" class="mt-3">
                    <el-skeleton-item variant="text" style="width: 92%" />
                  </div>
                </template>
              </el-skeleton>
            </div>
          </div>
          <div v-else-if="!hot" class="news-empty">热榜加载失败，点击右上角刷新重试</div>
          <div v-else class="hot-columns">
            <MarketHotList v-for="source in hot.sources" :key="source.key" :source="source" />
          </div>
        </template>

        <div v-else class="news-column">
          <template v-if="!news && !errorMsg">
            <el-skeleton animated>
              <template #template>
                <div v-for="n in 6" :key="n" class="py-2.5">
                  <el-skeleton-item variant="h3" style="width: 70%" />
                  <div class="mt-2">
                    <el-skeleton-item variant="text" style="width: 94%" />
                  </div>
                  <div class="mt-1">
                    <el-skeleton-item variant="text" style="width: 32%" />
                  </div>
                </div>
              </template>
            </el-skeleton>
          </template>
          <div v-else-if="!news" class="news-empty">资讯加载失败，点击右上角刷新重试</div>
          <template v-else>
            <a v-for="item in displayItems" :key="item.id" :href="item.url" target="_blank" rel="noopener noreferrer"
              class="news-item">
              <div class="news-item-title">
                <span v-if="category === 'all'" class="news-tag">{{ CATEGORY_NAMES[item.category] }}</span>
                <span class="news-title">{{ item.title }}</span>
              </div>
              <p v-if="item.summary" class="news-summary">{{ item.summary }}</p>
              <p class="news-meta">{{ item.source }} · {{ formatTime(item.publishTime) }}</p>
            </a>
            <div v-if="!displayItems.length" class="news-empty">暂无{{ categoryLabel }}新闻</div>
          </template>
        </div>
      </el-col>
      <el-col :xs="24" :lg="8" class="news-flash-col">
        <div class="flash-column">
          <p class="flash-title">7×24 快讯</p>
          <div class="flash-list">
            <template v-if="news">
              <a v-for="flash in news.flashes" :key="flash.id" :href="flash.url || undefined" target="_blank"
                rel="noopener noreferrer" class="flash-item">
                <span class="flash-time">{{ formatTime(flash.publishTime) }}</span>
                <div class="flash-body">
                  <p class="flash-headline">{{ flash.title }}</p>
                  <p v-if="flash.content && flash.content !== flash.title" class="flash-text">{{ flash.content }}</p>
                </div>
              </a>
              <div v-if="!news.flashes.length" class="news-empty">暂无快讯</div>
            </template>
            <el-skeleton v-else-if="!errorMsg" animated>
              <template #template>
                <div v-for="n in 5" :key="n" class="py-2">
                  <el-skeleton-item variant="text" style="width: 90%" />
                  <div class="mt-1">
                    <el-skeleton-item variant="text" style="width: 60%" />
                  </div>
                </div>
              </template>
            </el-skeleton>
            <div v-else class="news-empty">快讯加载失败</div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { getMarketHotApi, getMarketNewsApi } from '@/api/market';
import type {
  MarketHotType,
  MarketNewsCategoryKeyType,
  MarketNewsType,
} from '@/api/market/type';
import dayjs from 'dayjs';
import MarketHotList from './MarketHotList.vue';

type CategoryFilterType = 'all' | MarketNewsCategoryKeyType | 'hot';

const CATEGORY_NAMES: Record<MarketNewsCategoryKeyType, string> = {
  finance: '金融',
  world: '国际',
};

const categoryOptions: { label: string; value: CategoryFilterType }[] = [
  { label: '全部', value: 'all' },
  { label: '金融', value: 'finance' },
  { label: '国际', value: 'world' },
  { label: '热榜', value: 'hot' },
];

const category = ref<CategoryFilterType>('all');
const news = ref<MarketNewsType | null>(null);
const loading = ref(false);
const errorMsg = ref('');
const hot = ref<MarketHotType | null>(null);
const hotLoading = ref(false);
const hotError = ref('');

const isHot = computed(() => category.value === 'hot');
const currentData = computed(() => (isHot.value ? hot.value : news.value));
const currentLoading = computed(() =>
  isHot.value ? hotLoading.value || loading.value : loading.value
);
const currentError = computed(() => (isHot.value ? hotError.value : errorMsg.value));

const categoryLabel = computed(
  () => categoryOptions.find((item) => item.value === category.value)?.label ?? ''
);

const displayItems = computed(() => {
  if (!news.value) return [];
  if (category.value === 'all') {
    return news.value.categories
      .flatMap((item) => item.items)
      .sort((a, b) => b.publishTime.localeCompare(a.publishTime))
      .slice(0, 20);
  }
  return news.value.categories.find((item) => item.key === category.value)?.items ?? [];
});

const formatTime = (value: string) => {
  const time = dayjs(value);
  if (!time.isValid()) return value;
  return time.isSame(dayjs(), 'day') ? time.format('HH:mm') : time.format('MM-DD HH:mm');
};

const fetchNews = async (force = false) => {
  if (loading.value) return;
  loading.value = true;
  try {
    const { data } = await getMarketNewsApi(force);
    news.value = data;
    errorMsg.value = '';
  } catch (err) {
    console.error('获取资讯数据失败:', err);
    errorMsg.value = news.value
      ? `资讯更新失败，当前展示 ${news.value.updateTime} 的数据`
      : '资讯更新失败';
  } finally {
    loading.value = false;
  }
};

const fetchHot = async (force = false) => {
  if (hotLoading.value) return;
  hotLoading.value = true;
  try {
    const { data } = await getMarketHotApi(force);
    hot.value = data;
    hotError.value = '';
  } catch (err) {
    console.error('获取热榜数据失败:', err);
    hotError.value = hot.value
      ? `热榜更新失败，当前展示 ${hot.value.updateTime} 的数据`
      : '热榜更新失败';
  } finally {
    hotLoading.value = false;
  }
};

const refresh = () => {
  if (isHot.value) {
    // 热榜与右侧快讯属于不同接口，刷新热榜时一并刷新快讯
    fetchHot(true);
    fetchNews(true);
    return;
  }
  fetchNews(true);
};

watch(category, (value) => {
  if (value === 'hot' && !hot.value) {
    fetchHot();
  }
});

onMounted(() => {
  fetchNews();
});
</script>

<style lang="scss" scoped>
.market-news {
  min-height: 420px;
}

.news-column,
.flash-column {
  height: 440px;
}

.news-column {
  overflow-y: auto;
  padding-right: 8px;
}

.news-item {
  display: block;
  padding: 8px 12px;
  border-radius: 8px;
  text-decoration: none;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: var(--theme-hover);
  }
}

.news-item-title {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}

.news-tag {
  flex: none;
  padding: 0 5px;
  font-size: 11px;
  line-height: 17px;
  border-radius: 3px;
  color: var(--el-color-primary);
  background-color: var(--theme-hover);
}

.news-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: var(--sys-text-color);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.news-summary {
  display: -webkit-box;
  margin-top: 3px;
  overflow: hidden;
  font-size: 12px;
  line-height: 18px;
  color: var(--sys-text-secondary-color);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.news-meta {
  margin-top: 4px;
  font-size: 11px;
  line-height: 16px;
  color: var(--sys-text-secondary-color);
}

.news-empty {
  padding: 40px 0;
  font-size: 12px;
  text-align: center;
  color: var(--sys-text-secondary-color);
}

.hot-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  height: 440px;
}

.hot-skeleton {
  min-width: 0;
  overflow: hidden;
}

@media (max-width: 1199px) {
  .hot-columns {
    grid-template-columns: minmax(0, 1fr);
    height: auto;
  }
}

.news-flash-col {
  @media (max-width: 1199px) {
    margin-top: 16px;
  }
}

.flash-column {
  display: flex;
  flex-direction: column;
  height: 440px;
  padding-left: 16px;
  border-left: 1px solid var(--sys-border-color);

  @media (max-width: 1199px) {
    height: 360px;
    padding-left: 0;
    border-left: none;
  }
}

.flash-title {
  flex: none;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--sys-text-color);
}

.flash-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.flash-item {
  display: flex;
  gap: 10px;
  padding: 6px 4px;
  border-radius: 6px;
  text-decoration: none;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: var(--theme-hover);
  }
}

.flash-time {
  flex: none;
  width: 42px;
  font-size: 11px;
  line-height: 18px;
  color: var(--el-color-primary);
  font-variant-numeric: tabular-nums;
}

.flash-body {
  flex: 1;
  min-width: 0;
}

.flash-headline,
.flash-text {
  display: -webkit-box;
  overflow: hidden;
  font-size: 12px;
  line-height: 18px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.flash-headline {
  color: var(--sys-text-color);
}

.flash-text {
  margin-top: 2px;
  color: var(--sys-text-secondary-color);
}

.market-icon-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out;

  &:hover:not(:disabled) {
    color: var(--el-color-primary);
    background-color: var(--theme-hover);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}
</style>
