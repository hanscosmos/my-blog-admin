<template>
  <div class="wh-full p-4 flex flex-col justify-between">
    <div class="flex items-center justify-between">
      <div class="flex items-center">
        <my-icon
          :name="currentType.icon"
          :size="16"
          class="mr-2 relative top-1px"
        />
        <span class="text-base">{{ currentType.title }}</span>
      </div>
      <el-dropdown trigger="hover" @command="handleCommand">
        <span class="hover-text wrapper-solid-text">
          <el-icon class=""><More /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="month">近一月</el-dropdown-item>
            <el-dropdown-item command="week">近一周</el-dropdown-item>
            <el-dropdown-item command="refresh">刷新</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <!-- 中间：总数 -->
    <div class="flex-1 flex flex-col items-center justify-center">
      <div class="text-4xl">
        <span class="mx-2 font-beauty">{{ statInfo.count }}</span
        >{{ currentType.unit }}
      </div>
    </div>

    <!-- 下部分：变化趋势 -->
    <div class="flex items-center justify-between text-sm">
      <div class="text-sm">
        本{{ currentRangeName }}：<span
          >{{ statInfo.this }}{{ currentType.unit }}</span
        >
      </div>
      <div class="flex items-center">
        <my-icon
          :name="statInfo.diff >= 0 ? 'up' : 'down'"
          class="mr-2"
        ></my-icon>
        <span>
          <span class="font-bold">{{ Math.abs(statInfo.diff) }}</span>
          {{ currentType.unit }}
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { getSysStatApi } from '@/api/system/sys';
import { StatEnum } from '@/types/sys/enum';
import { defineProps } from 'vue';

const props = defineProps<{
  type: StatEnum;
}>();

const typeMap: Record<
  StatEnum,
  { title: string; icon: string; unit: string; timeUnit: 'month' | 'week' }
> = {
  article: {
    title: '文章',
    icon: 'view-list',
    unit: '篇',
    timeUnit: 'month',
  },
  user: {
    title: '用户',
    icon: 'user',
    unit: '个',
    timeUnit: 'month',
  },
  drafts: {
    title: '草稿',
    icon: 'pencil',
    unit: '篇',
    timeUnit: 'month',
  },
  column: {
    title: '专栏',
    icon: 'tag',
    unit: '个',
    timeUnit: 'month',
  },
};

const currentType = computed(() => typeMap[props.type]);

const currentRangeType = ref<'month' | 'week'>(currentType.value.timeUnit);
const currentRangeName = computed(() => {
  return currentRangeType.value === 'month' ? '月' : '周';
});

const statInfo = ref<StatItemType>({
  count: 0,
  this: 0,
  last: 0,
  diff: 0,
});
const getSysStat = async () => {
  const { data } = await getSysStatApi({
    type: props.type,
    rangeType: currentRangeType.value,
  });
  statInfo.value = data;
};

const handleCommand = (command: string) => {
  switch (command) {
    case 'refresh':
      getSysStat();
      break;
    case 'month':
      if (currentRangeType.value === 'month') {
        break;
      } else {
        currentRangeType.value = 'month';
        getSysStat();
      }
      break;
    case 'week':
      if (currentRangeType.value === 'week') {
        break;
      } else {
        currentRangeType.value = 'week';
        getSysStat();
      }
      break;
  }
};

onMounted(() => {
  getSysStat();
});
</script>

<style scoped>
/* 可选，卡片 hover 效果柔和 */
</style>
