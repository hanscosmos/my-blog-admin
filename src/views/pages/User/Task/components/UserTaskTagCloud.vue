<template>
  <div v-if="tagList.length" class="flex items-center gap-2 flex-wrap">
    <span class="flex-shrink-0 text-sm text-gray-400">标签</span>
    <span v-for="item in tagList" :key="item.name" class="cursor-pointer" @click="emits('select', item.name)">
      <app-tag :name="`${item.name} ${item.count}`" :color="getTagColor(item.name)"
        :opacity="item.name === activeTag ? 0.3 : 0.1" round></app-tag>
    </span>
    <span v-if="activeTag" class="cursor-pointer text-xs text-gray-400" @click="emits('select', '')">清除筛选</span>
  </div>
</template>
<script setup lang="ts">
import type { UserTaskTagItemType } from '@/api/user/task/type';

defineProps<{
  tagList: UserTaskTagItemType[];
  activeTag: string;
}>();

const emits = defineEmits<{
  (e: 'select', tag: string): void;
}>();
</script>
