<template>
  <div class="market-asset-panel">
    <el-skeleton v-if="initialLoading" animated>
      <template #template>
        <div
          class="rounded-lg px-4 py-4 mb-4"
          style="border: 1px solid var(--sys-border-color)"
        >
          <el-skeleton-item variant="text" style="width: 20%" />
          <div class="mt-3">
            <el-skeleton-item variant="h1" style="width: 40%" />
          </div>
        </div>
        <div
          class="rounded-lg px-4 py-4"
          style="border: 1px solid var(--sys-border-color)"
        >
          <div
            v-for="n in 4"
            :key="n"
            class="flex items-center justify-between py-3"
          >
            <el-skeleton-item variant="text" style="width: 35%" />
            <el-skeleton-item variant="text" style="width: 18%" />
            <el-skeleton-item variant="text" style="width: 18%" />
          </div>
        </div>
      </template>
    </el-skeleton>

    <div v-else-if="initialFailed" class="asset-empty">
      资产加载失败，点击右上角刷新重试
    </div>

    <template v-else>
      <div class="asset-summary">
        <div class="asset-total">
          <span class="summary-label">总资产</span>
          <span class="asset-total-value">{{ formatAmount(totalAssets) }}</span>
          <span class="asset-total-sub">
            投入本金 {{ formatAmount(totalPrincipal) }}
          </span>
        </div>

        <div v-if="segments.length" class="asset-categories">
          <div
            v-for="segment in segments"
            :key="segment.key"
            class="asset-category"
          >
            <span class="category-name">
              <i :style="{ backgroundColor: segment.color }"></i>
              {{ segment.name }}
            </span>
            <span class="category-value">{{
              formatAmount(segment.value)
            }}</span>
            <span class="category-ratio"
              >占比 {{ formatRatio(segment.ratio) }}</span
            >
          </div>
        </div>

        <div class="asset-stats">
          <div class="summary-item">
            <span class="summary-label">当日收益</span>
            <span
              class="summary-value"
              :class="pnlClass(hasTodayPnl ? totalTodayPnl : null)"
            >
              {{
                hasTodayPnl ? formatSignedAmount(totalTodayPnl) : '待更新'
              }}
            </span>
          </div>
          <div class="summary-item">
            <span class="summary-label">累计收益</span>
            <span class="summary-value" :class="pnlClass(totalPnl)">
              {{ formatSignedAmount(totalPnl) }}
            </span>
            <span class="summary-sub" :class="pnlClass(totalPnl)">
              {{ formatPercent(totalReturnRate) }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="segments.length" class="asset-allocation">
        <div class="allocation-bar">
          <div
            v-for="segment in segments"
            :key="segment.key"
            class="allocation-segment"
            :style="{
              width: `${segment.ratio ?? 0}%`,
              backgroundColor: segment.color,
            }"
            :title="`${segment.name} ${formatRatio(segment.ratio)}`"
          ></div>
        </div>
      </div>

      <p v-if="incomplete" class="text-xs text-amber-500 mb-3">
        部分资产缺少行情，汇总数据不完整
      </p>

      <div class="asset-scroll">
        <MarketCashSection
          :portfolio="cashPortfolio"
          :loading="cashLoading"
          :error-msg="cashErrorMsg"
          @refresh="cashRefresh"
        />
        <MarketFundSection
          :portfolio="fundPortfolio"
          :loading="fundLoading"
          :error-msg="fundErrorMsg"
          @refresh="fundRefresh"
        />
        <p class="asset-footer">
          总资产 = 基金市值 + 现金/存款余额；当日收益中，基金取盘中估值或已公布净值，
          现金取最近万份收益或日利息。
        </p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useMarketCashPortfolio } from '../hooks/useMarketCashPortfolio';
import {
  formatCny,
  useMarketFundPortfolio,
} from '../hooks/useMarketFundPortfolio';
import {
  CASH_DEPOSIT_COLOR,
  CASH_MONEY_FUND_COLOR,
  fundCategoryColor,
} from '../hooks/useMarketFundMeta';
import MarketCashSection from './MarketCashSection.vue';
import MarketFundSection from './MarketFundSection.vue';

type SegmentType = {
  key: string;
  name: string;
  value: number;
  color: string;
  ratio: number | null;
};

const {
  portfolio: fundPortfolio,
  loading: fundLoading,
  errorMsg: fundErrorMsg,
  refresh: fundRefresh,
} = useMarketFundPortfolio();

const {
  portfolio: cashPortfolio,
  loading: cashLoading,
  errorMsg: cashErrorMsg,
  refresh: cashRefresh,
} = useMarketCashPortfolio();

const initialLoading = computed(
  () =>
    !fundPortfolio.value &&
    !cashPortfolio.value &&
    (fundLoading.value ||
      cashLoading.value ||
      (!fundErrorMsg.value && !cashErrorMsg.value))
);

const initialFailed = computed(
  () =>
    !fundPortfolio.value &&
    !cashPortfolio.value &&
    !fundLoading.value &&
    !cashLoading.value &&
    Boolean(fundErrorMsg.value || cashErrorMsg.value)
);

const totalAssets = computed(
  () =>
    (fundPortfolio.value?.summary.totalMarketValue ?? 0) +
    (cashPortfolio.value?.summary.totalBalance ?? 0)
);

const totalPrincipal = computed(
  () =>
    (fundPortfolio.value?.summary.totalCost ?? 0) +
    (cashPortfolio.value?.summary.totalPrincipal ?? 0)
);

const totalTodayPnl = computed(
  () =>
    (fundPortfolio.value?.summary.totalTodayPnl ?? 0) +
    (cashPortfolio.value?.summary.totalYesterdayPnl ?? 0)
);

const totalPnl = computed(
  () =>
    (fundPortfolio.value?.summary.totalPnlIncludingRealized ?? 0) +
    (cashPortfolio.value?.summary.totalPnl ?? 0)
);

const totalReturnRate = computed(() =>
  totalPrincipal.value > 0
    ? (totalPnl.value / totalPrincipal.value) * 100
    : null
);

const hasTodayPnl = computed(
  () =>
    (fundPortfolio.value?.items ?? []).some(
      (item) => item.todayPnl !== null
    ) ||
    (cashPortfolio.value?.items ?? []).some(
      (item) => item.yesterdayPnl !== null
    )
);

const incomplete = computed(() =>
  Boolean(
    fundPortfolio.value?.summary.incomplete ||
      cashPortfolio.value?.summary.incomplete
  )
);

const segments = computed<SegmentType[]>(() => {
  const list: Omit<SegmentType, 'ratio'>[] = [];
  const cashItems = cashPortfolio.value?.items ?? [];
  const moneyFundValue = cashItems
    .filter((item) => item.kind === 'money_fund')
    .reduce((sum, item) => sum + item.balance, 0);
  const depositValue = cashItems
    .filter((item) => item.kind === 'deposit')
    .reduce((sum, item) => sum + item.balance, 0);

  if (moneyFundValue > 0) {
    list.push({
      key: 'cash_money_fund',
      name: '余额宝/货币基金',
      value: moneyFundValue,
      color: CASH_MONEY_FUND_COLOR,
    });
  }
  if (depositValue > 0) {
    list.push({
      key: 'cash_deposit',
      name: '银行存款',
      value: depositValue,
      color: CASH_DEPOSIT_COLOR,
    });
  }

  (fundPortfolio.value?.categories ?? []).forEach((category) => {
    if (category.marketValue > 0) {
      list.push({
        key: `fund_${category.category}`,
        name: category.name,
        value: category.marketValue,
        color: fundCategoryColor(category.category),
      });
    }
  });

  const segmentTotal = list.reduce((sum, item) => sum + item.value, 0);
  return list.map((item) => ({
    ...item,
    ratio: segmentTotal > 0 ? (item.value / segmentTotal) * 100 : null,
  }));
});

const pnlClass = (value: number | null) =>
  value === null
    ? ''
    : value > 0
      ? 'text-red-500'
      : value < 0
        ? 'text-green-500'
        : '';

const formatAmount = (value: number | null) =>
  value === null ? '--' : formatCny(value);

const formatSignedAmount = (value: number | null) =>
  value === null ? '--' : formatCny(value, true);

const formatPercent = (value: number | null) =>
  value === null ? '--' : `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;

const formatRatio = (value: number | null) =>
  value === null ? '--' : `${value.toFixed(2)}%`;

defineExpose({
  updateTime: computed(() => {
    const times = [
      fundPortfolio.value?.updateTime,
      cashPortfolio.value?.updateTime,
    ].filter(Boolean) as string[];
    times.sort();
    return times.length ? times[times.length - 1] : '';
  }),
  stale: computed(() =>
    Boolean(fundPortfolio.value?.stale || cashPortfolio.value?.stale)
  ),
  loading: computed(() => fundLoading.value || cashLoading.value),
  refresh: () => {
    fundRefresh();
    cashRefresh();
  },
});
</script>

<style lang="scss" scoped>
// 汇总统计固定在上方，只有下方明细滚动
.market-asset-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding-bottom: 1rem;
}

.asset-summary {
  --asset-value-color: #e0a800;
  --asset-value-gradient: linear-gradient(180deg, #ffda4a 0%, #dfa000 100%);

  display: flex;
  flex: none;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px 40px;
  padding: 16px 20px;
  margin-bottom: 12px;
  background: linear-gradient(
    135deg,
    rgba(20, 184, 166, 0.08),
    rgba(59, 130, 246, 0.05) 55%,
    transparent 78%
  );
  border: 1px solid var(--sys-border-color);
  border-radius: 8px;
}

:global(html.dark) .asset-summary {
  --asset-value-color: #ffdd55;
  --asset-value-gradient: linear-gradient(180deg, #ffeb8a 0%, #ffc400 100%);
}

.asset-total {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 200px;
}

.asset-total-value {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.1;
  color: var(--asset-value-color);
  background: var(--asset-value-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.asset-total-sub {
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

.asset-categories {
  display: flex;
  flex: 1 1 320px;
  flex-wrap: wrap;
  gap: 10px 28px;
}

.asset-category {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 110px;
}

.category-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--sys-text-secondary-color);

  i {
    width: 8px;
    height: 8px;
    border-radius: 2px;
  }
}

.category-value {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--asset-value-color);
  background: var(--asset-value-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.category-ratio {
  font-size: 11px;
  color: var(--sys-text-secondary-color);
}

.asset-stats {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 36px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 120px;
}

.summary-label {
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

.summary-value {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.2;
}

.summary-sub {
  font-size: 12px;
}

.asset-allocation {
  flex: none;
  margin-bottom: 14px;
}

.allocation-bar {
  display: flex;
  height: 8px;
  overflow: hidden;
  background: var(--theme-hover);
  border-radius: 4px;
}

.allocation-segment {
  height: 100%;
  transition: width 0.3s ease-in-out;
}

.asset-scroll {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 20px;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
}

.asset-footer {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

.asset-empty {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  font-size: 13px;
  color: var(--sys-text-secondary-color);
}

@media (max-width: 767px) {
  .asset-summary {
    gap: 14px 20px;
  }

  .asset-total {
    min-width: 100%;
  }

  .asset-categories {
    flex-basis: 100%;
    gap: 10px 20px;
  }

  .asset-stats {
    gap: 12px 20px;
  }
}
</style>
