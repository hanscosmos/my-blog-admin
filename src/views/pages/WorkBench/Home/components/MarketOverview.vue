<template>
  <div class="market-overview section-wrapper p-6">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <h3 class="text-lg font-title flex items-center gap-2">
        <AppIcon name="chart-line" size="18"></AppIcon>
        市场行情
      </h3>
      <div
        class="flex items-center gap-3 text-xs"
        style="color: var(--sys-text-secondary-color)"
      >
        <span v-if="overview">更新于 {{ overview.updateTime }}</span>
        <span v-if="overview?.stale" class="text-amber-500">数据可能延迟</span>
        <span
          v-if="autoRefresh"
          class="flex items-center gap-1.5"
          title="每 60 秒自动刷新一次；页面切到后台时暂停，回到前台后继续"
        >
          <span
            class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"
          ></span>
          自动刷新中 · 60s/次
        </span>
        <span class="flex items-center gap-1.5">
          <el-switch v-model="autoRefresh" size="small" />
          自动刷新
        </span>
        <el-button size="small" :loading="loading" @click="refresh">
          刷新
        </el-button>
      </div>
    </div>

    <p v-if="errorMsg" class="text-xs text-amber-500 mb-3">{{ errorMsg }}</p>

    <el-skeleton v-if="!overview && !errorMsg" animated>
      <template #template>
        <el-row :gutter="16">
          <el-col
            v-for="(count, index) in SKELETON_ITEM_COUNTS"
            :key="index"
            :xs="24"
            :sm="12"
            :lg="6"
            class="mb-4 lg:mb-0"
          >
            <div
              class="h-full rounded-lg px-4 py-2"
              style="border: 1px solid var(--sys-border-color)"
            >
              <div class="flex items-center justify-between py-1.5 mb-1">
                <el-skeleton-item variant="h3" style="width: 35%" />
                <el-skeleton-item variant="text" style="width: 22%" />
              </div>
              <div
                v-for="n in count"
                :key="n"
                class="flex items-center justify-between py-2.5"
              >
                <el-skeleton-item variant="text" style="width: 38%" />
                <el-skeleton-item variant="text" style="width: 30%" />
              </div>
            </div>
          </el-col>
        </el-row>
      </template>
    </el-skeleton>
    <div
      v-else-if="!overview"
      class="py-10 text-center text-sm"
      style="color: var(--sys-text-secondary-color)"
    >
      行情加载失败，点击右上角刷新重试
    </div>
    <el-row
      v-else
      v-loading="loading"
      element-loading-text="更新中..."
      element-loading-background="rgba(128, 128, 128, 0.18)"
      :gutter="16"
    >
      <el-col
        v-for="group in overview.groups"
        :key="group.key"
        :xs="24"
        :sm="12"
        :lg="6"
        class="mb-4 lg:mb-0"
      >
        <div
          class="h-full rounded-lg px-4 py-2"
          style="border: 1px solid var(--sys-border-color)"
        >
          <div class="flex items-center justify-between py-1.5">
            <span class="text-sm font-bold">{{ group.name }}</span>
            <span
              class="flex items-center gap-1.5 text-xs"
              style="color: var(--sys-text-secondary-color)"
            >
              <span
                class="w-2 h-2 rounded-full"
                :style="{ backgroundColor: statusColor(group.status) }"
              ></span>
              {{ group.statusText }}
            </span>
          </div>
          <div
            v-for="(item, index) in group.items"
            :key="item.key"
            class="group flex items-baseline justify-between px-2 -mx-2 rounded py-2.5"
            :class="{ 'market-item-clickable': canTrend(item) }"
            :style="{
              borderTop:
                index > 0 ? 'dashed 1px var(--sys-border-color)' : 'none',
            }"
            :title="itemTitle(item)"
            @click="openTrend(item)"
          >
            <span class="flex items-center gap-1 text-sm">
              {{ item.name }}
              <AppIcon
                v-if="canTrend(item)"
                name="trend"
                :size="12"
                class="opacity-0 group-hover:opacity-100 transition-opacity"
                style="color: var(--sys-text-secondary-color)"
              ></AppIcon>
            </span>
            <div class="flex flex-col items-end">
              <span class="text-sm font-beauty">{{ formatPrice(item) }}</span>
              <span
                v-if="item.change !== null || item.changePercent !== null"
                class="text-xs"
                :class="changeClass(item.change)"
              >
                {{ formatChange(item.change, item.precision) }}
                {{ formatPercent(item.changePercent) }}
              </span>
              <span v-else-if="item.price !== null" class="text-xs text-gray-400">
                {{ item.quoteTime || '暂无数据' }}
              </span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <p
      class="text-xs mt-1"
      style="color: var(--sys-text-secondary-color)"
    >
      数据仅供参考，美股行情可能延迟约 15 分钟。
    </p>

    <MarketTrendDialog
      v-if="trendVisible"
      :visible="trendVisible"
      :item="trendItem"
      @close="closeTrend"
    />
  </div>
</template>

<script setup lang="ts">
import { getMarketOverviewApi } from '@/api/market';
import type {
  MarketItemType,
  MarketOverviewType,
  MarketStatusType,
} from '@/api/market/type';
import { useDocumentVisibility, useIntervalFn } from '@vueuse/core';
import MarketTrendDialog from './MarketTrendDialog.vue';

const AUTO_REFRESH_INTERVAL = 60 * 1000;
const SKELETON_ITEM_COUNTS = [4, 2, 5, 2];
const TREND_KEYS = new Set([
  'sh000001',
  'sh000300',
  'sz399006',
  'sh000688',
  'usINX',
  'usNDX',
  'hf_XAU',
  'hf_XAG',
  'hf_OIL',
  'hf_CL',
]);

const overview = ref<MarketOverviewType | null>(null);
const loading = ref(false);
const errorMsg = ref('');
const autoRefresh = ref(false);
const trendVisible = ref(false);
const trendItem = ref<MarketItemType | null>(null);

const canTrend = (item: MarketItemType) => TREND_KEYS.has(item.key);

const itemTitle = (item: MarketItemType) => {
  const parts: string[] = [];
  if (canTrend(item)) parts.push('点击查看趋势');
  if (item.quoteTime) parts.push(`行情时间：${item.quoteTime}`);
  return parts.join(' · ');
};

const openTrend = (item: MarketItemType) => {
  if (!canTrend(item)) return;
  trendItem.value = item;
  trendVisible.value = true;
};

const closeTrend = () => {
  trendVisible.value = false;
};

const visibility = useDocumentVisibility();

const fetchMarket = async (force = false) => {
  if (loading.value) return;
  loading.value = true;
  try {
    const { data } = await getMarketOverviewApi(force);
    overview.value = data;
    errorMsg.value = '';
  } catch (err) {
    console.error('获取行情数据失败:', err);
    errorMsg.value = overview.value
      ? `行情更新失败，当前展示 ${overview.value.updateTime} 的数据`
      : '行情更新失败';
  } finally {
    loading.value = false;
  }
};

const refresh = () => fetchMarket(true);

const { pause, resume } = useIntervalFn(
  () => {
    if (visibility.value === 'visible') {
      fetchMarket(true);
    }
  },
  AUTO_REFRESH_INTERVAL,
  { immediate: false }
);

watch(autoRefresh, (enabled) => {
  if (enabled) {
    resume();
  } else {
    pause();
  }
});

const statusColor = (status: MarketStatusType) => {
  if (status === 'open') return '#22c55e';
  if (status === 'break') return '#f59e0b';
  return '#9ca3af';
};

const formatPrice = (item: MarketItemType) => {
  if (item.price === null || item.price === undefined) return '--';
  return item.price.toLocaleString('zh-CN', {
    minimumFractionDigits: item.precision,
    maximumFractionDigits: item.precision,
  });
};

const formatChange = (value: number | null, precision = 2) => {
  if (value === null || value === undefined) return '--';
  return `${value > 0 ? '+' : ''}${value.toFixed(precision)}`;
};

const formatPercent = (value: number | null) => {
  if (value === null || value === undefined) return '--';
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const changeClass = (value: number | null) => {
  if (value === null || value === undefined || value === 0) {
    return 'text-gray-400';
  }
  return value > 0 ? 'text-red-500' : 'text-green-500';
};

onMounted(() => {
  fetchMarket();
});
</script>

<style lang="scss" scoped>
.market-item-clickable {
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: var(--theme-hover);
  }
}
</style>
