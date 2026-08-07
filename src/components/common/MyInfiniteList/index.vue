<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core';

interface Item {
  id: string;
  [key: string]: any;
}

const props = defineProps<{
  items: Item[];
  loading: boolean;
  finished: boolean;
}>();

const emits = defineEmits<{
  (e: 'loadMore'): void;
}>();

const target = ref<HTMLElement | null>(null);

// 监听锚点是否进入可视区域
useIntersectionObserver(target, ([{ isIntersecting }]) => {
  if (isIntersecting && !props.loading && !props.finished) {
    emits('loadMore');
  }
});
</script>

<template>
  <div class="overflow-auto wh-full">
    <div v-for="item in items" :key="item.id" class="border-bottom">
      <slot name="item" :item="item">{{ item }}</slot>
    </div>

    <div ref="target" class="h-10 flex items-center justify-center">
      <div v-if="loading" class="text-gray-500">加载中...</div>
      <div v-else-if="finished" class="text-gray-400">没有更多了</div>
    </div>
  </div>
</template>
