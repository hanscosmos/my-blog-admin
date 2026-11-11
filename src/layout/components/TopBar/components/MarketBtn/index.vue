<template>
  <div v-if="isSuper" class="hover-text flex flex-col items-center cursor-pointer" @click="visible = true">
    <AppIcon name="chart-line" :size="16"></AppIcon>
    <span class="text-xs mt-1">市场行情</span>
  </div>

  <Teleport v-if="isSuper" to="body">
    <AppDialog :visible="visible" title="行情中心" width="min(1200px, 94vw)" :fullscreen="isCompactScreen"
      hide-footer @close="closeHandler">
      <template #header>
        <span class="market-dialog-title">行情中心</span>
      </template>
      <MarketOverview v-if="visible" :fullscreen="isCompactScreen" />
    </AppDialog>
  </Teleport>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { useMediaQuery } from '@vueuse/core';
import { usePermissionStore } from '@/store/permission';
import MarketOverview from './components/MarketOverview.vue';

// 与原首页市场行情保持一致：仅超级管理员可见
const { isSuper } = storeToRefs(usePermissionStore());

// 笔记本屏幕普遍较矮（如 1440×900、1536×864），普通弹窗高度不够用，直接全屏展示
const isCompactScreen = useMediaQuery(
  '(max-width: 1536px), (max-height: 900px)'
);

const visible = ref(false);

const closeHandler = () => {
  visible.value = false;
};
</script>

<style lang="scss" scoped>
.market-dialog-title {
  font-size: 15px;
  font-family: YouSheBiaoTiHei, serif;
  color: var(--sys-text-color);
}
</style>
