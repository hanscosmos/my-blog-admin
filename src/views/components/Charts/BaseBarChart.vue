<template>
  <BaseBarLineChart
    :title="title"
    :getDataFn="getDataFn"
    :xDataKey="xDataKey"
    :yDataKey="yDataKey"
    :unit="unit"
    chart-type="bar"
    :show-toggle="false"
  />
</template>

<script setup lang="ts">
import BaseBarLineChart from './BaseBarLineChart.vue';

defineProps<{
  title: string;
  getDataFn: (params: any) => Promise<any[]>;
  xDataKey: string;
  yDataKey: string;
  unit: string;
}>();
</script>
