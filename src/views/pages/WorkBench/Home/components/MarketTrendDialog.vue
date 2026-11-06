<template>
  <AppDialog
    :visible="visible"
    width="720px"
    :title="`${item?.name || ''} 趋势`"
    hide-footer
    @close="closeHandler"
  >
    <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
      <el-segmented v-model="period" :options="periodOptions" />
      <span class="text-xs" style="color: var(--sys-text-secondary-color)">
        {{ dataRangeText }}
      </span>
    </div>
    <div
      v-loading="loading"
      element-loading-text="加载中..."
      element-loading-background="rgba(128, 128, 128, 0.15)"
      class="h-360px"
    >
      <AppEcharts v-if="chartOption" :option="chartOption" />
      <div
        v-else-if="!loading"
        class="h-full flex flex-col items-center justify-center gap-2 text-sm"
        style="color: var(--sys-text-secondary-color)"
      >
        <span>{{ errorMsg || '暂无趋势数据' }}</span>
        <el-button
          v-if="errorMsg"
          link
          type="primary"
          @click="fetchTrend(true)"
        >
          重试
        </el-button>
      </div>
    </div>
    <p class="text-xs mt-2" style="color: var(--sys-text-secondary-color)">
      数据来源：东方财富，仅供参考。
    </p>
  </AppDialog>
</template>

<script setup lang="ts">
import { getMarketTrendApi } from '@/api/market';
import type {
  MarketItemType,
  MarketTrendPeriodType,
  MarketTrendType,
} from '@/api/market/type';
import { useSystemStore } from '@/store/system';
import { storeToRefs } from 'pinia';
import type { EChartsOption } from 'echarts';

const props = defineProps<{
  visible: boolean;
  item: MarketItemType | null;
}>();

const emits = defineEmits(['close']);

const { isDark } = storeToRefs(useSystemStore());

const periodOptions = [
  { label: '分时', value: 'minute' },
  { label: '日K', value: 'day' },
  { label: '周K', value: 'week' },
  { label: '月K', value: 'month' },
];

const period = ref<MarketTrendPeriodType>('minute');
const loading = ref(false);
const errorMsg = ref('');
const trendData = ref<MarketTrendType | null>(null);
const trendCache = new Map<MarketTrendPeriodType, MarketTrendType>();
let requestSeq = 0;

const closeHandler = () => emits('close');

const fetchTrend = async (force = false) => {
  if (!props.item) return;
  const currentPeriod = period.value;
  const cached = trendCache.get(currentPeriod);
  if (!force && cached) {
    trendData.value = cached;
    errorMsg.value = '';
    return;
  }
  const seq = ++requestSeq;
  loading.value = true;
  errorMsg.value = '';
  trendData.value = null;
  try {
    const { data } = await getMarketTrendApi({
      key: props.item.key,
      period: currentPeriod,
      force,
    });
    if (seq !== requestSeq) return;
    trendCache.set(currentPeriod, data);
    trendData.value = data;
  } catch (err) {
    if (seq !== requestSeq) return;
    console.error('获取趋势数据失败:', err);
    errorMsg.value = '趋势数据加载失败，请稍后重试';
  } finally {
    if (seq === requestSeq) loading.value = false;
  }
};

watch(period, () => {
  fetchTrend();
});

onMounted(() => {
  fetchTrend();
});

const dataRangeText = computed(() => {
  const data = trendData.value;
  if (!data) return '';
  if (data.period === 'minute') {
    const points = data.points || [];
    if (!points.length) return '';
    return `${points[0].time.slice(0, 16)} 至 ${points[points.length - 1].time.slice(0, 16)}`;
  }
  const items = data.items || [];
  if (!items.length) return '';
  return `${items[0].date} 至 ${items[items.length - 1].date}`;
});

const formatValue = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '--';
  return value.toFixed(trendData.value?.precision ?? 2);
};

const chartOption = computed<EChartsOption | null>(() => {
  const data = trendData.value;
  if (!data) return null;

  const textColor = isDark.value ? '#a1a1aa' : '#6c757d';
  const axisLineColor = isDark.value ? '#454a51' : '#dee2e6';
  const splitLineColor = isDark.value ? '#3f3f46' : '#eef0f2';
  const axisLabel = { color: textColor };
  const axisLine = { lineStyle: { color: axisLineColor } };

  if (data.period === 'minute') {
    const points = data.points || [];
    if (!points.length) return null;
    const hasAvg = points.some((point) => !!point.avg);
    const series: NonNullable<EChartsOption['series']> = [
      {
        name: '价格',
        type: 'line',
        data: points.map((point) => point.price),
        showSymbol: false,
        lineStyle: { width: 1.5, color: '#3b82f6' },
        itemStyle: { color: '#3b82f6' },
        areaStyle: { color: 'rgba(59, 130, 246, 0.12)' },
        markLine: data.preClose
          ? {
              symbol: 'none',
              silent: true,
              label: { show: false },
              lineStyle: { type: 'dashed', color: textColor },
              data: [{ yAxis: data.preClose }],
            }
          : undefined,
      },
    ];
    if (hasAvg) {
      series.push({
        name: '均价',
        type: 'line',
        data: points.map((point) => point.avg),
        showSymbol: false,
        lineStyle: { width: 1, color: '#f59e0b' },
        itemStyle: { color: '#f59e0b' },
      });
    }
    return {
      animation: false,
      grid: { left: 8, right: 12, top: 16, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const list = Array.isArray(params) ? params : [params];
          if (!list.length) return '';
          const priceItem = list.find(
            (item: any) => item.seriesName === '价格'
          );
          const avgItem = list.find((item: any) => item.seriesName === '均价');
          const lines = [
            list[0].axisValue,
            `价格 ${formatValue(priceItem?.value)}`,
          ];
          if (avgItem) {
            lines.push(`均价 ${formatValue(avgItem.value)}`);
          }
          return lines.join('<br/>');
        },
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: points.map((point) => point.time),
        axisLabel: {
          ...axisLabel,
          formatter: (value: string) => value.slice(11, 16),
        },
        axisLine,
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        scale: true,
        axisLabel: {
          ...axisLabel,
          formatter: (value: number) => value.toFixed(data.precision),
        },
        splitLine: { lineStyle: { color: splitLineColor } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series,
    };
  }

  const items = data.items || [];
  if (!items.length) return null;
  return {
    animation: false,
    grid: { left: 8, right: 12, top: 16, bottom: 44, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: (params: any) => {
        const point = Array.isArray(params) ? params[0] : params;
        const [open, close, high, low] = point.data;
        return [
          point.axisValue,
          `开盘 ${formatValue(open)}`,
          `收盘 ${formatValue(close)}`,
          `最高 ${formatValue(high)}`,
          `最低 ${formatValue(low)}`,
        ].join('<br/>');
      },
    },
    xAxis: {
      type: 'category',
      data: items.map((item) => item.date),
      axisLabel,
      axisLine,
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLabel: {
        ...axisLabel,
        formatter: (value: number) => value.toFixed(data.precision),
      },
      splitLine: { lineStyle: { color: splitLineColor } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    dataZoom: [
      { type: 'inside', start: 60, end: 100 },
      {
        type: 'slider',
        height: 16,
        bottom: 8,
        start: 60,
        end: 100,
        borderColor: 'transparent',
        backgroundColor: 'transparent',
        fillerColor: isDark.value
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(0, 0, 0, 0.06)',
        handleStyle: { color: axisLineColor },
        textStyle: { color: textColor },
      },
    ],
    series: [
      {
        name: data.name,
        type: 'candlestick',
        data: items.map((item) => [item.open, item.close, item.low, item.high]),
        itemStyle: {
          color: '#ef4444',
          color0: '#22c55e',
          borderColor: '#ef4444',
          borderColor0: '#22c55e',
        },
      },
    ],
  };
});
</script>

<style lang="scss" scoped></style>
