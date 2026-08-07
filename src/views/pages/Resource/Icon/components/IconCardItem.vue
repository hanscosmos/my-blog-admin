<template>
  <div
    class="icon-card-item wh-full xy-center hover-border border-wrapper rounded-md"
  >
    <div class="w-6 h-6 icon">
      <img :src="item.url" alt="" class="wh-full" />
    </div>
    <div v-if="layout === 'list'" class="ml-4 flex flex-col">
      <span class="text-xs">{{ item.name }}</span>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { IconItemType } from '@/api/resource/icon/type';

type PropsType = { item: IconItemType; layout: string };
defineProps<PropsType>();
</script>
<style lang="scss" scoped></style>
