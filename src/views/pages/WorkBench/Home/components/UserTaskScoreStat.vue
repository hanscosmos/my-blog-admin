<template>
  <BaseBarLineChart
    title="个人表现趋势"
    x-data-key="date"
    y-data-key="score"
    :get-data-fn="getDataFn"
    unit="分"
  ></BaseBarLineChart>
</template>

<script setup lang="ts">
import { getUserTaskScoreStatApi } from '@/api/user/task';
const getDataFn = async (params: {
  rangeType: string;
  startDate?: string;
  endDate?: string;
}) => {
  const { data } = await getUserTaskScoreStatApi(params);
  return data;
};
</script>

<style scoped>
/* 可选微调 */
</style>
