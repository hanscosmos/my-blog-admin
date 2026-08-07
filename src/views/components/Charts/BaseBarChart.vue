<template>
  <div class="p-4 wh-full flex flex-col">
    <!-- 顶部选择 -->
    <div class="flex items-center justify-between mb-4 gap-4">
      <span class="font-title text-lg flex items-center">
        <my-icon name="trend" :size="16" class="mr-2"></my-icon>
        {{ title }}</span
      >

      <el-radio-group
        v-model="rangeMode"
        @change="onRangeChange"
        size="default"
        class="ml-8"
      >
        <el-radio-button label="week">近一周</el-radio-button>
        <el-radio-button label="month">近一月</el-radio-button>
        <el-radio-button label="year">近一年</el-radio-button>
        <el-radio-button label="custom">自定义</el-radio-button>
      </el-radio-group>

      <el-date-picker
        v-if="rangeMode === 'custom'"
        v-model="customRange"
        type="daterange"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        @change="fetchData"
      />
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
import * as echarts from 'echarts'; // 引入配置文件

const props = defineProps<{
  title: string;
  getDataFn: (params: any) => Promise<any[]>;
  xDataKey: string;
  yDataKey: string;
  unit: string;
}>();
// 快捷选择模式
const rangeMode = ref<'week' | 'month' | 'year' | 'custom'>('year');
const customRange = ref<string[] | string>('');

const chartXData = ref<string[]>([]);
const chartYData = ref<number[]>([]);

const { systemColor, isDark } = storeToRefs(useSystemStore());

const option = computed(() => {
  return {
    xAxis: {
      type: 'category',
      axisLine: {
        lineStyle: { color: isDark.value ? '#666' : '#ccc' },
      },
      splitLine: {
        lineStyle: { color: isDark.value ? '#444' : '#eee' },
      },
      data: chartXData?.value || [],
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: { color: isDark.value ? '#666' : '#ccc' },
      },
      splitLine: {
        lineStyle: { color: isDark.value ? '#444' : '#eee' },
      },
    },
    grid: {
      top: 20, // 上边距
      right: 20, // 右边距
      bottom: 20, // 下边距
      left: 30, // 左边距
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark.value ? '#333' : '#fff',
      borderColor: isDark.value ? '#555' : '#ccc',
      borderWidth: 1,
      textStyle: {
        color: isDark.value ? '#fff' : '#000',
      },
      formatter: (params: any) => {
        if (!params || !params.length) return '';
        return params
          .map((p: any) => `${p.axisValue}<br/> ${p.data ?? 0}${props.unit}`)
          .join('<br/>');
      },
    },

    series: [
      {
        type: 'bar',
        data: chartYData?.value || [],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(
            0,
            0,
            0,
            1, // 渐变方向：0,0 到 1,0 表示水平方向
            [
              { offset: 0, color: toRgba(systemColor.value, 0.8) }, // 起始颜色
              { offset: 0.5, color: toRgba(systemColor.value, 0.5) }, // 中间过渡色
              { offset: 1, color: toRgba(systemColor.value, 0.2) }, // 结束颜色
            ]
          ),
        },
        lineStyle: { color: systemColor.value },
      },
    ],
  };
});

// 根据快捷选择计算日期
const getRangeDates = () => {
  if (rangeMode.value !== 'custom') {
    return ['', ''];
  } else {
    return customRange.value;
  }
};

// 请求接口
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

// 切换快捷模式
const onRangeChange = () => {
  if (rangeMode.value !== 'custom') {
    fetchData();
  } else {
    if (customRange.value) {
      fetchData();
    }
  }
};

// 初始化加载
onMounted(() => {
  fetchData();
});
</script>

<style scoped>
/* 可选微调 */
</style>
