<template>
  <BaseBarChart
    title="文章发表数量统计"
    x-data-key="date"
    y-data-key="count"
    unit="篇"
    :get-data-fn="getDataFn"
  ></BaseBarChart>
</template>

<script setup lang="ts">
import { getArticlePublishStatApi } from '@/api/article';
const getDataFn = async (params: {
  rangeType: string;
  startDate?: string;
  endDate?: string;
}) => {
  const { data } = await getArticlePublishStatApi(params);
  return data;
};
</script>

<style scoped>
/* 可选微调 */
</style>
