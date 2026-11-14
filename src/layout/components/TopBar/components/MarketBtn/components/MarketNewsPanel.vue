<template>
  <div class="market-news">
    <p v-if="hotError" class="text-xs text-amber-500 mb-3">{{ hotError }}</p>
    <p v-if="errorMsg" class="text-xs text-amber-500 mb-3">{{ errorMsg }}</p>

    <el-row
      v-loading="panelLoading"
      element-loading-text="更新中..."
      :gutter="20"
      class="news-row"
    >
      <el-col :xs="24" :lg="16" class="news-hot-col">
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
        <div v-else-if="!hot" class="news-empty">
          热榜加载失败，点击右上角刷新重试
        </div>
        <div v-else class="hot-columns">
          <MarketHotList
            v-for="source in hot.sources"
            :key="source.key"
            :source="source"
          />
        </div>
      </el-col>
      <el-col :xs="24" :lg="8" class="news-flash-col">
        <div class="flash-column">
          <p class="flash-title">7×24 快讯</p>
          <div class="flash-list">
            <template v-if="news">
              <a
                v-for="flash in news.flashes"
                :key="flash.id"
                :href="flash.url || undefined"
                target="_blank"
                rel="noopener noreferrer"
                class="flash-item"
              >
                <span class="flash-time">{{
                  formatTime(flash.publishTime)
                }}</span>
                <div class="flash-body">
                  <p class="flash-headline">{{ flash.title }}</p>
                  <p
                    v-if="flash.content && flash.content !== flash.title"
                    class="flash-text"
                  >
                    {{ flash.content }}
                  </p>
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
import type { MarketHotType, MarketNewsType } from '@/api/market/type';
import dayjs from 'dayjs';
import MarketHotList from './MarketHotList.vue';

const news = ref<MarketNewsType | null>(null);
const loading = ref(false);
const errorMsg = ref('');
const hot = ref<MarketHotType | null>(null);
const hotLoading = ref(false);
const hotError = ref('');

const panelLoading = computed(() => hotLoading.value || loading.value);
const updateTime = computed(() => {
  const newsTime = news.value?.updateTime ?? '';
  const hotTime = hot.value?.updateTime ?? '';
  return newsTime > hotTime ? newsTime : hotTime;
});
const stale = computed(() => Boolean(news.value?.stale || hot.value?.stale));

const formatTime = (value: string) => {
  const time = dayjs(value);
  if (!time.isValid()) return value;
  return time.isSame(dayjs(), 'day')
    ? time.format('HH:mm')
    : time.format('MM-DD HH:mm');
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
  // 热榜与右侧快讯属于不同接口，一并刷新
  fetchHot(true);
  fetchNews(true);
};

defineExpose({ updateTime, stale, loading: panelLoading, refresh });

onMounted(() => {
  fetchHot();
  fetchNews();
});
</script>

<style lang="scss" scoped>
// 面板占满可用高度，热榜两列与快讯各自独立滚动
.market-news {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 420px;
}

.news-row {
  flex: 1;
  min-height: 0;
}

.news-hot-col,
.news-flash-col {
  height: 100%;
  min-height: 0;
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
  grid-auto-rows: minmax(0, 1fr);
  gap: 16px;
  height: 100%;
  min-height: 0;
}

.hot-skeleton {
  min-width: 0;
  overflow: hidden;
}

@media (max-width: 1199px) {
  .market-news {
    height: auto;
    min-height: 0;
  }

  .news-row {
    flex: none;
    min-height: auto;
  }

  .news-hot-col,
  .news-flash-col {
    height: auto;
  }

  .hot-columns {
    grid-template-columns: minmax(0, 1fr);
    grid-auto-rows: auto;
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
  height: 100%;
  min-height: 0;
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
  min-height: 0;
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
</style>
