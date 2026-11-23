<template>
  <div ref="echartsRef" class="echarts-container w-full h-full"></div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts'; // 引入配置文件
import { useElementSize } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useSystemStore } from '@/store/system';

type EChartsOption = echarts.EChartsOption;
type PropsType = {
  option: EChartsOption;
  isResponsive?: boolean;
  /** auto：跟随明暗主题；none：透明背景（用于卡片内嵌图表） */
  background?: 'auto' | 'none';
};

const props = withDefaults(defineProps<PropsType>(), {
  isResponsive: true,
  background: 'auto',
});

type ChartClickParamsType = {
  name?: string;
  key?: string;
};

const emit = defineEmits<{
  (e: 'chart-click', params: ChartClickParamsType): void;
}>();

const { mode } = storeToRefs(useSystemStore());
const mergedOption = computed(() => {
  return {
    ...props.option,
    backgroundColor:
      props.background === 'none'
        ? 'transparent'
        : mode.value === 'dark'
          ? '#35363f'
          : '#ffffff',
    textStyle: {
      color: mode.value === 'dark' ? '#ffffff' : '#333333',
    },
  };
});
let myChart: echarts.ECharts | null;
const echartsRef = ref();
const { width, height } = useElementSize(echartsRef);
watch([width, height], () => {
  props.isResponsive && (myChart as echarts.ECharts).resize();
});

const getDom = () => {
  if (myChart) {
    return myChart.getDom();
  }
};
const setOption = () => {
  if (myChart) {
    myChart.setOption(mergedOption.value);
  }
};
const bindEvents = () => {
  myChart?.on('click', (params) => {
    const data = params.data as { key?: string } | undefined;
    emit('chart-click', { name: params.name, key: data?.key });
  });
};
const repaint = () => {
  if (myChart) {
    myChart.dispose();
  }
  myChart = echarts.init(echartsRef.value);
  bindEvents();
  myChart.setOption(mergedOption.value);
};

onMounted(() => {
  // 渲染图表
  if (echartsRef.value) {
    myChart = echarts.init(echartsRef.value);
    bindEvents();
    myChart.setOption(props.option);
  }
});
onBeforeUnmount(() => {
  if (myChart) {
    myChart.dispose();
    myChart = null;
  }
});

watch(mergedOption, (newOption) => {
  if (myChart) {
    myChart.setOption(newOption, true);
  }
});

defineExpose({
  getDom,
  setOption,
  repaint,
});
</script>

<style lang="scss" scoped></style>
