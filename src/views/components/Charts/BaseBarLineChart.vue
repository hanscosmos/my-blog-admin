<template>
  <div class="p-4 wh-full flex flex-col section-wrapper">
    <!-- 顶部选择 -->
    <div class="flex items-center justify-between mb-4 gap-4">
      <span class="font-title text-lg flex items-center">
        <my-icon name="trend" :size="16" class="mr-2"></my-icon>
        {{ title }}
      </span>
      <div class="flex items-center">
        <!-- 图表类型切换（可通过 showToggle 隐藏） -->
        <el-radio-group v-if="showToggle" v-model="currentChartType"
          @change="$emit('update:chartType', currentChartType)" size="default">
          <el-radio-button label="bar">
            <my-icon name="chart-histogram" :size="14" class="xy-center"></my-icon>

          </el-radio-button>
          <el-radio-button label="line">
            <my-icon name="chart-line" :size="14" class="xy-center"></my-icon>
          </el-radio-button>
        </el-radio-group>

        <!-- 时间范围切换 -->
        <el-radio-group v-model="rangeMode" @change="onRangeChange" size="default" class="ml-8">
          <el-radio-button label="week">近一周</el-radio-button>
          <el-radio-button label="month">近一月</el-radio-button>
          <el-radio-button label="year">近一年</el-radio-button>
          <el-radio-button label="custom">自定义</el-radio-button>
        </el-radio-group>

        <el-date-picker v-if="rangeMode === 'custom'" class="ml-4" v-model="customRange" type="daterange"
          start-placeholder="开始日期" end-placeholder="结束日期" @change="fetchData" />
      </div>


    </div>

    <!-- 图表 -->
    <MyEcharts :option="option as EChartsOption" class="flex-1 h-0 w-full" />
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { storeToRefs } from 'pinia';
import { useSystemStore } from '@/store/system';
import { toRgba } from '@/utils/tool';
import { EChartsOption } from 'echarts';
import * as echarts from 'echarts';

const props = withDefaults(defineProps<{
  title: string;
  getDataFn: (params: any) => Promise<any[]>;
  xDataKey: string;
  yDataKey: string;
  unit: string;
  chartType?: 'bar' | 'line';
  showToggle?: boolean;
}>(), {
  chartType: 'line',
  showToggle: true,
});

defineEmits<{
  'update:chartType': [value: 'bar' | 'line'];
}>();

// 内部维护可变的 chartType，同步 prop 和 emit
const currentChartType = ref<'bar' | 'line'>(props.chartType!);
watch(() => props.chartType, (val) => {
  if (val) currentChartType.value = val;
});

// 快捷选择模式
const rangeMode = ref<'week' | 'month' | 'year' | 'custom'>('week');
const customRange = ref<string[] | string>('');

const chartXData = ref<string[]>([]);
const chartYData = ref<number[]>([]);

const { systemColor, isDark } = storeToRefs(useSystemStore());

// 公共坐标轴、网格、tooltip
const baseOption = computed(() => ({
  xAxis: {
    type: 'category',
    axisLine: { lineStyle: { color: isDark.value ? '#666' : '#ccc' } },
    splitLine: { lineStyle: { color: isDark.value ? '#444' : '#eee' } },
    data: chartXData?.value || [],
  },
  yAxis: {
    type: 'value',
    axisLine: { lineStyle: { color: isDark.value ? '#666' : '#ccc' } },
    splitLine: { lineStyle: { color: isDark.value ? '#444' : '#eee' } },
  },
  grid: { top: 20, right: 20, bottom: 20, left: 30 },
  tooltip: {
    trigger: 'axis',
    backgroundColor: isDark.value ? '#333' : '#fff',
    borderColor: isDark.value ? '#555' : '#ccc',
    borderWidth: 1,
    textStyle: { color: isDark.value ? '#fff' : '#000' },
    formatter: (params: any) => {
      if (!params || !params.length) return '';
      return params
        .map((p: any) => `${p.axisValue}<br/> ${p.data ?? 0}${props.unit}`)
        .join('<br/>');
    },
  },
}));

// 柱状图 series
const barSeries = computed(() => ({
  type: 'bar' as const,
  data: chartYData?.value || [],
  itemStyle: {
    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
      { offset: 0, color: toRgba(systemColor.value, 0.8) },
      { offset: 0.5, color: toRgba(systemColor.value, 0.5) },
      { offset: 1, color: toRgba(systemColor.value, 0.2) },
    ]),
  },
  lineStyle: { color: systemColor.value },
}));

// 折线图 series
const lineSeries = computed(() => ({
  type: 'line' as const,
  data: chartYData?.value || [],
  smooth: true,
  symbolSize: 0,
  areaStyle: {
    color: {
      type: 'linear' as const,
      x: 0, y: 0, x2: 0, y2: 1,
      colorStops: [
        { offset: 0, color: toRgba(systemColor.value, 0.8) },
        { offset: 0.5, color: toRgba(systemColor.value, 0.5) },
        { offset: 1, color: toRgba(systemColor.value, 0.2) },
      ],
    },
  },
  itemStyle: { color: systemColor.value, borderWidth: 2 },
  lineStyle: { color: systemColor.value },
}));

const option = computed(() => ({
  ...baseOption.value,
  series: [currentChartType.value === 'bar' ? barSeries.value : lineSeries.value],
}));

const getRangeDates = () => {
  if (rangeMode.value !== 'custom') return ['', ''];
  return customRange.value;
};

const fetchData = async () => {
  try {
    const [start, end] = getRangeDates();
    const data = await props.getDataFn({
      rangeType: rangeMode.value,
      startDate: start ? dayjs(start).format('YYYY-MM-DD') : '',
      endDate: end ? dayjs(end).format('YYYY-MM-DD') : '',
    });
    chartXData.value = data.map((item) => item[props.xDataKey]) || [];
    chartYData.value =
      data.map((item) => Math.round(item[props.yDataKey] * 10) / 10) || [];
  } catch (err) {
    console.error(err);
  }
};

const onRangeChange = () => {
  if (rangeMode.value !== 'custom') {
    fetchData();
  } else {
    if (customRange.value) fetchData();
  }
};

onMounted(() => { fetchData(); });
</script>

<style scoped>
/* 可选微调 */
</style>
