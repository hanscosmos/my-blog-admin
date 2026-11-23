<template>
  <div class="allocation-chart">
    <div class="allocation-chart-main">
      <AppEcharts
        v-if="segments.length"
        :option="chartOption"
        background="none"
        @chart-click="handleChartClick"
      />
      <div v-if="segments.length" class="allocation-center">
        <span class="allocation-center-label">总资产</span>
        <span class="allocation-center-value">{{ totalText }}</span>
      </div>
    </div>
    <div class="allocation-legend">
      <button
        v-for="segment in segments"
        :key="segment.key"
        type="button"
        class="allocation-legend-item"
        :title="`查看「${segment.name}」趋势`"
        @click="emit('select', segment.key)"
      >
        <span class="legend-dot" :style="{ backgroundColor: segment.color }"></span>
        <span class="legend-name">{{ segment.name }}</span>
        <span class="legend-ratio">{{ formatRatio(segment.ratio) }}</span>
        <span class="legend-value">{{ formatValue(segment.value) }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { graphic } from 'echarts';
import type { EChartsOption } from 'echarts';
import { useSystemStore } from '@/store/system';
import { storeToRefs } from 'pinia';
import { formatCny } from '../hooks/useMarketFundPortfolio';
import { AMOUNT_MASK } from '../hooks/useAmountVisibility';

type SegmentType = {
  key: string;
  name: string;
  value: number;
  color: string;
  ratio: number | null;
};

const props = defineProps<{
  segments: SegmentType[];
  totalText: string;
  hidden: boolean;
}>();

const emit = defineEmits<{
  (e: 'select', key: string): void;
}>();

const { mode } = storeToRefs(useSystemStore());

const parseHex = (hex: string) => {
  const value = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return null;
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
};

/** 向白色（255）或黑色（0）混合，生成同色系渐变的端点 */
const mixColor = (hex: string, target: number, ratio: number) => {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const channel = (value: number) =>
    Math.round(value + (target - value) * ratio);
  return `rgb(${channel(rgb.r)}, ${channel(rgb.g)}, ${channel(rgb.b)})`;
};

const sliceColor = (hex: string) =>
  new graphic.LinearGradient(0, 0, 1, 1, [
    { offset: 0, color: mixColor(hex, 255, 0.35) },
    { offset: 0.55, color: hex },
    { offset: 1, color: mixColor(hex, 0, 0.18) },
  ]);

const chartOption = computed<EChartsOption>(() => ({
  animation: false,
  tooltip: {
    trigger: 'item',
    formatter: (params: any) => {
      const segment = props.segments.find((item) => item.key === params.data?.key);
      const dot = `<span style="display:inline-block;width:8px;height:8px;margin-right:6px;border-radius:2px;background:${
        segment?.color ?? '#999'
      }"></span>`;
      return `${dot}${params.name}<br/>${formatValue(params.value)}（${params.percent}%）`;
    },
  },
  series: [
    {
      type: 'pie',
      radius: ['62%', '82%'],
      center: ['50%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderColor: mode.value === 'dark' ? '#35363f' : '#ffffff',
        borderWidth: 2,
        shadowBlur: mode.value === 'dark' ? 12 : 16,
        shadowColor:
          mode.value === 'dark' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(15, 23, 42, 0.16)',
        shadowOffsetY: 2,
      },
      label: { show: false },
      emphasis: { scale: true, scaleSize: 4, label: { show: false } },
      data: props.segments.map((segment) => ({
        key: segment.key,
        name: segment.name,
        value: segment.value,
        itemStyle: { color: sliceColor(segment.color) },
      })),
    },
  ],
}));

const handleChartClick = (params: { key?: string }) => {
  if (params.key) emit('select', params.key);
};

const formatRatio = (value: number | null) =>
  value === null ? '--' : `${value.toFixed(1)}%`;

const formatValue = (value: number) =>
  props.hidden ? AMOUNT_MASK : formatCny(value);
</script>

<style lang="scss" scoped>
.allocation-chart {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px 28px;
  padding: 14px 20px;
  border: 1px solid var(--sys-border-color);
  border-radius: 8px;
}

.allocation-chart-main {
  position: relative;
  flex: none;
  width: 280px;
  height: 280px;
}

.allocation-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  pointer-events: none;

  .allocation-center-label {
    font-size: 13px;
    color: var(--sys-text-secondary-color);
  }

  .allocation-center-value {
    max-width: 160px;
    font-size: 18px;
    font-weight: 600;
    line-height: 1.2;
    text-align: center;
    color: var(--sys-text-color);
  }
}

.allocation-legend {
  display: flex;
  flex: 1 1 240px;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.allocation-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
  padding: 7px 10px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--sys-text-color);
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;

  &:hover {
    background-color: var(--theme-hover);
    border-color: var(--sys-border-color);
  }

  .legend-dot {
    flex: none;
    width: 8px;
    height: 8px;
    border-radius: 2px;
  }

  .legend-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .legend-ratio {
    flex: none;
    color: var(--sys-text-secondary-color);
  }

  .legend-value {
    flex: none;
    font-weight: 600;
  }
}

@media (max-width: 767px) {
  .allocation-chart {
    padding: 12px 14px;
  }

  .allocation-chart-main {
    width: 220px;
    height: 220px;
    margin: 0 auto;
  }

  .allocation-legend {
    flex-basis: 100%;
  }

  .allocation-legend-item {
    padding: 8px 6px;
  }
}
</style>
