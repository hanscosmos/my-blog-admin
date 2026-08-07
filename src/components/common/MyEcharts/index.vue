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
};

const props = withDefaults(defineProps<PropsType>(), {
  isResponsive: true,
});

const { mode } = storeToRefs(useSystemStore());
const mergedOption = computed(() => {
  return {
    ...props.option,
    backgroundColor: mode.value === 'dark' ? '#1f1f1f' : '#ffffff',
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
const repaint = () => {
  if (myChart) {
    myChart.dispose();
  }
  myChart = echarts.init(echartsRef.value);
  myChart.setOption(mergedOption.value);
};

onMounted(() => {
  // 渲染图表
  if (echartsRef.value) {
    myChart = echarts.init(echartsRef.value);
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
