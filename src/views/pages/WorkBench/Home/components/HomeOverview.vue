<template>
  <div class="wh-full p-6">
    <h3 class="text-2xl mb-6 flex items-center justify-between">
      <span>欢迎你， {{ userInfo.nickName }} </span>
      <span class="font-beauty">{{ fmtTime(nowTime) }}</span>
    </h3>
    <p class="text-base mb-2">
      今年已度过<span class="font-beauty mx-2">{{ yearProgress }}%</span
      >，您发表了<span class="font-beauty mx-2">{{ articleStats.year }}</span
      >篇文章，创建了<span class="font-beauty mx-2">{{ draftStats.year }}</span
      >篇草稿。
    </p>
    <p class="text-base mb-2">
      本月已度过<span class="font-beauty mx-2">{{ monthProgress }}%</span
      >，您发表了<span class="font-beauty mx-2">{{ articleStats.month }}</span
      >篇文章，创建了<span class="font-beauty mx-2">{{ draftStats.month }}</span
      >篇草稿。
    </p>
    <p class="text-base">
      本周已度过<span class="font-beauty mx-2">{{ weekProgress }}%</span
      >，您发表了<span class="font-beauty mx-2">{{ articleStats.week }}</span
      >篇文章，创建了<span class="font-beauty mx-2">{{ draftStats.week }}</span
      >篇草稿。
    </p>
  </div>
</template>
<script lang="ts" setup>
import { getSelfStatApi } from '@/api/system/sys';
import { useUserInfoStore } from '@/store/user';
import { useNow } from '@vueuse/core';
import { storeToRefs } from 'pinia';

const { userInfo } = storeToRefs(useUserInfoStore());
const nowTime = useNow();

// 年度进度
const yearProgress = computed(() => {
  const start = new Date(nowTime.value.getFullYear(), 0, 1);
  const end = new Date(nowTime.value.getFullYear() + 1, 0, 1);
  const percent =
    ((nowTime.value.getTime() - start.getTime()) /
      (end.getTime() - start.getTime())) *
    100;
  return percent.toFixed(1);
});

// 月度进度
const monthProgress = computed(() => {
  const start = new Date(
    nowTime.value.getFullYear(),
    nowTime.value.getMonth(),
    1
  );
  const end = new Date(
    nowTime.value.getFullYear(),
    nowTime.value.getMonth() + 1,
    1
  );
  const percent =
    ((nowTime.value.getTime() - start.getTime()) /
      (end.getTime() - start.getTime())) *
    100;
  return percent.toFixed(1);
});

// 本周进度百分比
const weekProgress = computed(() => {
  const day = nowTime.value.getDay() === 0 ? 7 : nowTime.value.getDay();

  // 本周一 00:00
  const startOfWeek = new Date(nowTime.value);
  startOfWeek.setDate(nowTime.value.getDate() - day + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  // 下周一 00:00
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  // 进度百分比
  const percent =
    ((nowTime.value.getTime() - startOfWeek.getTime()) /
      (endOfWeek.getTime() - startOfWeek.getTime())) *
    100;

  return Math.min(Math.max(percent, 0), 100).toFixed(1); // 限制在 0-100 之间
});
const articleStats = ref<StatSelfType>({ year: 0, month: 0, week: 0 });
const draftStats = ref<StatSelfType>({ year: 0, month: 0, week: 0 });

const getSelfStat = async () => {
  try {
    const { data } = await getSelfStatApi();
    articleStats.value = data.article;
    draftStats.value = data.draft;
  } catch (err) {
    console.error(err);
  }
};

onMounted(() => {
  getSelfStat();
});
</script>
<style lang="scss" scoped></style>
