<template>
  <div class="holding-trend">
    <div class="trend-toolbar" data-export-ignore>
      <div class="trend-filters">
        <el-select
          :model-value="scopeValue"
          class="trend-scope"
          size="small"
          filterable
          @change="changeScope"
        >
          <el-option label="总资产" value="total" />
          <el-option-group
            v-if="groupOptions.length"
            label="资产类别"
          >
            <el-option
              v-for="group in groupOptions"
              :key="group.group"
              :label="group.name"
              :value="`group:${group.group}`"
            />
          </el-option-group>
          <el-option-group
            v-if="itemOptions.length"
            label="单支基金 / 单项现金"
          >
            <el-option
              v-for="item in itemOptions"
              :key="item.key"
              :label="item.name"
              :value="`item:${item.key}`"
            />
          </el-option-group>
        </el-select>
        <el-segmented v-model="metric" :options="metricOptions" size="small" />
        <el-segmented v-model="range" :options="rangeOptions" size="small" />
      </div>
      <span v-if="snapshots.length" class="trend-meta">
        最近记录 {{ latestSnapshot?.date }} · 共 {{ snapshots.length }} 次
      </span>
    </div>

    <div
      v-if="loading"
      class="trend-state"
    >
      持仓历史加载中…
    </div>
    <div v-else-if="errorMsg" class="trend-state">
      <span>{{ errorMsg }}</span>
      <el-button link type="primary" @click="emit('retry')">重试</el-button>
    </div>
    <div v-else-if="!snapshots.length" class="trend-state">
      <span>还没有历史快照</span>
      <span class="trend-hint">
        保存持仓后会自动记录；也可以先记录当前状态作为起点
      </span>
      <el-button
        type="primary"
        plain
        size="small"
        :loading="recording"
        @click="emit('record')"
      >
        记录当前持仓
      </el-button>
    </div>
    <div v-else-if="!chartOption" class="trend-state">
      {{ hasScopeData ? '所选时间范围内暂无记录' : '该资产暂无历史记录' }}
    </div>
    <div v-else class="trend-chart">
      <AppEcharts :option="chartOption" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EChartsOption } from 'echarts';
import dayjs from 'dayjs';
import { storeToRefs } from 'pinia';
import { useSystemStore } from '@/store/system';
import type {
  MarketFundCategoryType,
  MarketHoldingSnapshotType,
} from '@/api/market/type';
import type { HoldingTrendScopeType } from '../type';
import {
  CASH_DEPOSIT_COLOR,
  CASH_MONEY_FUND_COLOR,
  fundCategoryColor,
} from '../hooks/useMarketFundMeta';
import { formatCny } from '../hooks/useMarketFundPortfolio';
import { AMOUNT_MASK } from '../hooks/useAmountVisibility';

type MetricType = 'amount' | 'pnl' | 'rate';
type RangeType = '3m' | '6m' | '1y' | 'all';
type GroupOptionType = { group: string; name: string };
type ItemOptionType = { key: string; name: string };

const props = defineProps<{
  scope: HoldingTrendScopeType;
  snapshots: MarketHoldingSnapshotType[];
  loading: boolean;
  recording: boolean;
  errorMsg: string;
  hidden: boolean;
}>();

const emit = defineEmits<{
  (e: 'change-scope', scope: HoldingTrendScopeType): void;
  (e: 'retry'): void;
  (e: 'record'): void;
}>();

const { mode } = storeToRefs(useSystemStore());

const metric = ref<MetricType>('amount');
const range = ref<RangeType>('1y');

const metricOptions = [
  { label: '总金额', value: 'amount' },
  { label: '累计收益', value: 'pnl' },
  { label: '收益率', value: 'rate' },
];

const rangeOptions = [
  { label: '近3月', value: '3m' },
  { label: '近6月', value: '6m' },
  { label: '近1年', value: '1y' },
  { label: '全部', value: 'all' },
];

const latestSnapshot = computed(
  () => props.snapshots[props.snapshots.length - 1] ?? null
);

const scopeGroups = computed<GroupOptionType[]>(() => {
  const map = new Map<string, string>();
  latestSnapshot.value?.items.forEach((item) => {
    map.set(item.group, item.groupName);
  });
  return [...map.entries()].map(([group, name]) => ({ group, name }));
});

const scopeItems = computed<ItemOptionType[]>(() =>
  (latestSnapshot.value?.items ?? []).map((item) => ({
    key: item.key,
    name: item.name,
  }))
);

const groupOptions = computed<GroupOptionType[]>(() => {
  const list = [...scopeGroups.value];
  const scope = props.scope;
  if (
    scope.type === 'group' &&
    !list.some((group) => group.group === scope.group)
  ) {
    list.push({ group: scope.group, name: scope.name });
  }
  return list;
});

const itemOptions = computed<ItemOptionType[]>(() => {
  const list = [...scopeItems.value];
  const scope = props.scope;
  if (scope.type === 'item' && !list.some((item) => item.key === scope.key)) {
    list.push({ key: scope.key, name: scope.name });
  }
  return list;
});

const scopeValue = computed(() => {
  if (props.scope.type === 'total') return 'total';
  if (props.scope.type === 'group') return `group:${props.scope.group}`;
  return `item:${props.scope.key}`;
});

const changeScope = (value: string) => {
  if (value === 'total') {
    emit('change-scope', { type: 'total' });
    return;
  }
  if (value.startsWith('group:')) {
    const group = value.slice(6);
    const name =
      groupOptions.value.find((item) => item.group === group)?.name ?? group;
    emit('change-scope', { type: 'group', group, name });
    return;
  }
  if (value.startsWith('item:')) {
    const key = value.slice(5);
    const name =
      itemOptions.value.find((item) => item.key === key)?.name ?? key;
    emit('change-scope', { type: 'item', key, name });
  }
};

const filteredSnapshots = computed(() => {
  if (range.value === 'all') return props.snapshots;
  const months = range.value === '3m' ? 3 : range.value === '6m' ? 6 : 12;
  const start = dayjs().subtract(months, 'month').startOf('day');
  return props.snapshots.filter((item) => !dayjs(item.date).isBefore(start));
});

const scopeGroup = computed(() => {
  const scope = props.scope;
  if (scope.type === 'group') return scope.group;
  if (scope.type !== 'item') return '';
  const key = scope.key;
  for (let index = props.snapshots.length - 1; index >= 0; index -= 1) {
    const item = props.snapshots[index].items.find(
      (snapshotItem) => snapshotItem.key === key
    );
    if (item) return item.group;
  }
  return '';
});

const scopeColor = computed(() => {
  if (props.scope.type === 'total') return '#e0a800';
  const group = scopeGroup.value;
  if (group === 'cash_money_fund') return CASH_MONEY_FUND_COLOR;
  if (group === 'cash_deposit') return CASH_DEPOSIT_COLOR;
  return fundCategoryColor(group as MarketFundCategoryType);
});

/** 当前作用域在单条快照上的数值；单支资产当天不存在时返回 null */
const calcSnapshotValue = (snapshot: MarketHoldingSnapshotType) => {
  const scope = props.scope;
  if (scope.type === 'total') {
    if (metric.value === 'amount') return snapshot.totalValue;
    if (metric.value === 'pnl') return snapshot.totalPnl;
    return snapshot.totalPrincipal > 0
      ? (snapshot.totalPnl / snapshot.totalPrincipal) * 100
      : null;
  }

  const items = snapshot.items.filter((item) =>
    scope.type === 'group'
      ? item.group === scope.group
      : item.key === scope.key
  );
  if (scope.type === 'item' && !items.length) return null;

  const value = items.reduce((sum, item) => sum + item.value, 0);
  const principal = items.reduce((sum, item) => sum + item.principal, 0);
  const pnl = items.reduce((sum, item) => sum + item.pnl, 0);
  if (metric.value === 'amount') return value;
  if (metric.value === 'pnl') return pnl;
  return principal > 0 ? (pnl / principal) * 100 : null;
};

const hasScopeData = computed(() =>
  filteredSnapshots.value.some((item) => calcSnapshotValue(item) !== null)
);

const formatMetricValue = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '--';
  if (metric.value === 'rate') return `${value.toFixed(2)}%`;
  if (props.hidden) return AMOUNT_MASK;
  return formatCny(value, metric.value === 'pnl');
};

const axisFormatter = (value: number) => {
  if (metric.value === 'rate') return `${value}%`;
  if (props.hidden) return '';
  const abs = Math.abs(value);
  if (abs >= 10000) return `${(value / 10000).toFixed(1)}万`;
  return `${value}`;
};

const metricLabel = computed(
  () =>
    metricOptions.find((item) => item.value === metric.value)?.label ?? '金额'
);

const scopeLabel = computed(() =>
  props.scope.type === 'total' ? '总资产' : props.scope.name
);

const chartOption = computed<EChartsOption | null>(() => {
  const data = filteredSnapshots.value;
  if (!data.length || !hasScopeData.value) return null;

  const textColor = mode.value === 'dark' ? '#a1a1aa' : '#6c757d';
  const axisLineColor = mode.value === 'dark' ? '#454a51' : '#dee2e6';
  const splitLineColor = mode.value === 'dark' ? '#3f3f46' : '#eef0f2';
  const dates = data.map((item) => item.date);

  const buildSeries = (
    name: string,
    values: (number | null)[],
    color: string
  ) => ({
    name,
    type: 'line' as const,
    data: values,
    showSymbol: data.length <= 60,
    symbolSize: 5,
    connectNulls: false,
    lineStyle: { width: 2, color },
    itemStyle: { color },
  });

  const series: NonNullable<EChartsOption['series']> = [];
  if (props.scope.type === 'total' && metric.value === 'amount') {
    series.push(buildSeries('总资产', data.map((item) => item.totalValue), '#e0a800'));
    series.push(buildSeries('基金', data.map((item) => item.fundValue), '#3b82f6'));
    series.push(buildSeries('现金', data.map((item) => item.cashValue), '#14b8a6'));
  } else {
    series.push(
      buildSeries(
        `${scopeLabel.value} ${metricLabel.value}`,
        data.map((item) => calcSnapshotValue(item)),
        scopeColor.value
      )
    );
  }

  return {
    animation: false,
    grid: { left: 8, right: 16, top: series.length > 1 ? 36 : 16, bottom: 8, containLabel: true },
    legend:
      series.length > 1
        ? { top: 0, textStyle: { color: textColor } }
        : { show: false },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const list = Array.isArray(params) ? params : [params];
        if (!list.length) return '';
        const lines = [list[0].axisValue];
        list.forEach((item: any) => {
          lines.push(
            `${item.marker}${item.seriesName}：${formatMetricValue(item.value)}`
          );
        });
        return lines.join('<br/>');
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: {
        color: textColor,
        formatter: (value: string) => value.slice(5),
      },
      axisLine: { lineStyle: { color: axisLineColor } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      scale: metric.value !== 'amount',
      axisLabel: { color: textColor, formatter: axisFormatter },
      splitLine: { lineStyle: { color: splitLineColor } },
    },
    series,
  };
});
</script>

<style lang="scss" scoped>
.holding-trend {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
}

.trend-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 16px;
}

.trend-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;

  .trend-scope {
    width: 200px;
  }
}

.trend-meta {
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

.trend-chart {
  height: 360px;
}

.trend-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 240px;
  font-size: 13px;
  color: var(--sys-text-secondary-color);
}

.trend-hint {
  font-size: 12px;
}

@media (max-width: 767px) {
  .trend-filters {
    .trend-scope {
      width: 100%;
    }
  }

  .trend-chart {
    height: 300px;
  }
}
</style>
