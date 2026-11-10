<template>
  <div class="market-overview section-wrapper p-6">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div class="market-tabs flex items-center">
        <button v-for="tab in tabOptions" :key="tab.value" type="button" class="market-tab"
          :class="{ 'is-active': activeTab === tab.value }" @click="activeTab = tab.value">
          <AppIcon :name="tab.icon" :size="18"></AppIcon>
          <span class="text-lg font-title">{{ tab.label }}</span>
        </button>
      </div>
      <div class="flex items-center gap-3 text-xs" style="color: var(--sys-text-secondary-color)">
        <template v-if="activeTab === 'market'">
          <span v-if="overview">更新于 {{ overview.updateTime }}</span>
          <span v-if="overview?.stale" class="text-amber-500">数据可能延迟</span>
          <span v-if="autoRefresh" class="flex items-center gap-1.5"
            title="每 60 秒自动刷新一次；页面切到后台时暂停，回到前台后继续">
            <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            自动刷新中 · 60s/次
          </span>
          <span class="flex items-center gap-1.5">
            <el-switch v-model="autoRefresh" size="small" />
            自动刷新
          </span>
        </template>
        <template v-else>
          <span v-if="newsPanelRef?.updateTime">更新于 {{ newsPanelRef.updateTime }}</span>
          <span v-if="newsPanelRef?.stale" class="text-amber-500">数据可能延迟</span>
        </template>
        <button type="button" class="market-icon-action" :title="collapsed ? '展开' : '收起'"
          @click="collapsed = !collapsed">
          <AppIcon :name="collapsed ? 'double-down' : 'double-up'" :size="16"></AppIcon>
        </button>
        <button type="button" class="market-icon-action" title="刷新" :disabled="activeLoading"
          @click="refreshActive">
          <AppIcon name="refresh" :size="16" :class="{ 'animate-spin': activeLoading }"></AppIcon>
        </button>
      </div>
    </div>

    <el-collapse-transition>
      <div v-show="!collapsed" ref="groupsRef">
        <div v-show="activeTab === 'market'">
          <p v-if="errorMsg" class="text-xs text-amber-500 mb-3">{{ errorMsg }}</p>

          <el-skeleton v-if="!overview && !errorMsg" animated>
            <template #template>
              <el-row :gutter="16">
                <el-col v-for="(count, index) in SKELETON_ITEM_COUNTS" :key="index" :xs="24"
                  :sm="index === 0 ? 24 : 12" :lg="index === 0 ? 24 : 8" class="mb-4">
                  <div class="h-full rounded-lg px-4 py-2" style="border: 1px solid var(--sys-border-color)">
                    <div class="flex items-center justify-between py-1.5 mb-1">
                      <el-skeleton-item variant="h3" style="width: 35%" />
                      <el-skeleton-item variant="text" style="width: 22%" />
                    </div>
                    <div v-for="n in count" :key="n" class="flex items-center justify-between py-2.5">
                      <el-skeleton-item variant="text" style="width: 38%" />
                      <el-skeleton-item variant="text" style="width: 30%" />
                    </div>
                  </div>
                </el-col>
              </el-row>
            </template>
          </el-skeleton>
          <div v-else-if="!overview" class="py-10 text-center text-sm"
            style="color: var(--sys-text-secondary-color)">
            行情加载失败，点击右上角刷新重试
          </div>
          <el-row v-else element-loading-text="更新中..." element-loading-background="rgba(128, 128, 128, 0.18)"
            :gutter="16">
            <el-col v-for="group in displayGroups" :key="group.key" :data-flip-key="group.key" :xs="24"
              :sm="group.isFavorite ? 24 : 12" :lg="group.isFavorite ? 24 : 8" class="mb-4">
              <MarketGroupCard :group="group" :is-favorite="isFavorite" :can-trend="canTrend"
                :get-pnl="getPnl" :total-pnl-cny="totalPnlCny" :has-pnl-data="hasPnlData"
                @move-group="moveGroup" @move-item="handleMoveItem" @toggle-favorite="toggleFavorite"
                @open-trend="openTrend" @open-portfolio="openPortfolio" />
            </el-col>
          </el-row>

          <p class="text-xs mt-1" style="color: var(--sys-text-secondary-color)">
            数据仅供参考，美股、美股期货行情可能延迟约 15 分钟，亚太指数行情可能延迟。
          </p>
        </div>

        <MarketNewsPanel v-if="newsMounted" v-show="activeTab === 'news'" ref="newsPanelRef" />
      </div>
    </el-collapse-transition>

    <MarketTrendDialog v-if="trendVisible" :visible="trendVisible" :item="trendItem" @close="closeTrend" />
    <MarketPortfolioDialog v-if="portfolioVisible" :visible="portfolioVisible" :items="favoriteItems"
      :positions="positions" @close="portfolioVisible = false" @save="handleSavePositions" />
  </div>
</template>

<script setup lang="ts">
import { getMarketOverviewApi } from '@/api/market';
import type {
  MarketItemType,
  MarketOverviewType,
} from '@/api/market/type';
import { useDocumentVisibility, useIntervalFn, useStorage } from '@vueuse/core';
import MarketTrendDialog from './MarketTrendDialog.vue';
import MarketGroupCard from './MarketGroupCard.vue';
import MarketNewsPanel from './MarketNewsPanel.vue';
import MarketPortfolioDialog from './MarketPortfolioDialog.vue';
import {
  useMarketLayout,
  type MarketItemMovePayloadType,
} from '../hooks/useMarketLayout';
import { useMarketFlip } from '../hooks/useMarketFlip';
import { useMarketPortfolio } from '../hooks/useMarketPortfolio';

const AUTO_REFRESH_INTERVAL = 60 * 1000;
const SKELETON_ITEM_COUNTS = [2, 4, 3, 4, 3, 5, 4];

type MarketTabType = 'market' | 'news';

const tabOptions: { label: string; value: MarketTabType; icon: string }[] = [
  { label: '市场行情', value: 'market', icon: 'chart-line' },
  { label: '市场新闻', value: 'news', icon: 'newspaper-folding' },
];
const TREND_KEYS = new Set([
  'sh000001',
  'sh000300',
  'sz399006',
  'sh000688',
  'kr_kospi',
  'jp_n225',
  'tw_twii',
  'hk_hsi',
  'hk_hstech',
  'usINX',
  'usNDX',
  'usDJI',
  'usIXIC',
  'usd_index',
  'hf_XAU',
  'hf_XAG',
  'hf_OIL',
  'hf_CL',
]);

const activeTab = ref<MarketTabType>('market');
const newsMounted = ref(false);
const overview = ref<MarketOverviewType | null>(null);
const loading = ref(false);
const errorMsg = ref('');
const autoRefresh = ref(false);
const collapsed = useStorage('market-overview-collapsed', false);
const trendVisible = ref(false);
const trendItem = ref<MarketItemType | null>(null);
const groupsRef = ref<HTMLElement | null>(null);

type MarketNewsPanelExposeType = {
  updateTime: string;
  stale: boolean;
  loading: boolean;
  refresh: () => void;
};
const newsPanelRef = ref<MarketNewsPanelExposeType | null>(null);

const {
  displayGroups,
  favoriteItems,
  favoriteUids,
  moveGroup,
  moveItem,
  toggleFavorite,
} = useMarketLayout(() => overview.value?.groups ?? []);

useMarketFlip({
  container: groupsRef,
  selector: '.el-row > .el-col[data-flip-key]',
  keys: () => displayGroups.value.map((group) => group.key),
  duration: 220,
});

watch(activeTab, (tab) => {
  if (tab === 'news') {
    newsMounted.value = true;
  }
});

const {
  positions,
  getPnl,
  totalPnlCny,
  hasPnlData,
  savePositions,
} = useMarketPortfolio({
  favorites: () => favoriteItems.value,
});

const portfolioVisible = ref(false);

const openPortfolio = () => {
  portfolioVisible.value = true;
};

const handleSavePositions = (next: Record<string, number>) => {
  savePositions(next);
  portfolioVisible.value = false;
};

const canTrend = (item: MarketItemType) => TREND_KEYS.has(item.key);

const isFavorite = (uid: string) => favoriteUids.value.has(uid);

const handleMoveItem = (payload: MarketItemMovePayloadType) => {
  moveItem(payload.groupKey, payload.fromUid, payload.toUid);
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

const activeLoading = computed(() =>
  activeTab.value === 'market'
    ? loading.value
    : Boolean(newsPanelRef.value?.loading)
);

const refreshActive = () => {
  if (activeTab.value === 'market') {
    refresh();
  } else {
    newsPanelRef.value?.refresh();
  }
};

const { pause, resume } = useIntervalFn(
  () => {
    if (visibility.value === 'visible' && activeTab.value === 'market') {
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

onMounted(() => {
  fetchMarket();
});
</script>

<style lang="scss" scoped>
.market-tabs {
  gap: 20px;
}

.market-tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0 6px;
  border: none;
  background: transparent;
  color: var(--sys-text-secondary-color);
  cursor: pointer;
  transition: color 0.2s ease-in-out;

  &:hover {
    color: var(--el-color-primary);
  }

  &.is-active {
    color: var(--sys-text-color);

    &::after {
      position: absolute;
      right: 0;
      bottom: 0;
      left: 0;
      height: 2px;
      background-color: var(--el-color-primary);
      border-radius: 1px;
      content: '';
    }
  }
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
