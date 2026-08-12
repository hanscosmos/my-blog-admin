<template>
  <div class="section-wrapper py-7 px-8">
    <div class="flex items-center justify-evenly">
      <template v-for="(item, index) in kpiItems" :key="item.type">
        <!-- KPI 指标项 -->
        <div class="flex items-center gap-5">
          <!-- 图标圆圈 -->
          <div
            class="w-12 h-12 rounded-lg xy-center flex-shrink-0"
            :style="{ backgroundColor: iconBgColor }"
          >
            <AppIcon :name="item.icon" :size="20" :color="systemColor" />
          </div>
          <!-- 数据 -->
          <div class="flex flex-col gap-0.5">
            <span class="text-xs text-gray-500">{{ item.label }}</span>
            <span class="text-3xl font-beauty leading-9">
              {{ formatNum(item.data.count) }}
              <span class="text-sm text-gray-400 font-normal">{{ item.unit }}</span>
            </span>
            <span class="text-xs flex items-center gap-0.5">
              <span
                class="flex items-center font-bold"
                :class="item.data.diff >= 0 ? 'text-green-500' : 'text-red-500'"
              >
                <AppIcon
                  :name="item.data.diff >= 0 ? 'up' : 'down'"
                  :size="10"
                />
                {{ Math.abs(item.data.diff) }}
              </span>
              <span class="text-gray-400">较上月</span>
            </span>
          </div>
        </div>
        <!-- 分隔线 -->
        <div
          v-if="index < kpiItems.length - 1"
          class="w-px h-14"
          style="background-color: var(--sys-border-color)"
        ></div>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { getSysStatApi } from '@/api/system/sys';
import { StatEnum } from '@/types/sys/enum';
import { storeToRefs } from 'pinia';
import { useSystemStore } from '@/store/system';
import { toRgba } from '@/utils/tool';

const { systemColor } = storeToRefs(useSystemStore());

const iconBgColor = computed(() => toRgba(systemColor.value, 0.12));

interface KpiItemConfig {
  type: StatEnum;
  label: string;
  icon: string;
  unit: string;
}

const kpiConfig: KpiItemConfig[] = [
  { type: StatEnum.Article, label: '文章总数', icon: 'view-list', unit: '篇' },
  { type: StatEnum.ArticleDraft, label: '草稿箱', icon: 'pencil', unit: '篇' },
  { type: StatEnum.User, label: '用户总数', icon: 'user', unit: '人' },
];

const defaultStat: StatItemType = { count: 0, this: 0, last: 0, diff: 0 };

const statData = ref<Record<string, StatItemType>>({});

const kpiItems = computed(() =>
  kpiConfig.map((config) => ({
    ...config,
    data: statData.value[config.type] || defaultStat,
  }))
);

const fetchStats = async () => {
  try {
    const results = await Promise.all(
      kpiConfig.map((config) =>
        getSysStatApi({ type: config.type, rangeType: 'month' })
      )
    );
    results.forEach((res, index) => {
      statData.value[kpiConfig[index].type] = res.data;
    });
  } catch (err) {
    console.error('获取统计数据失败:', err);
  }
};

const formatNum = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  }
  return num.toLocaleString();
};

onMounted(() => {
  fetchStats();
});
</script>
