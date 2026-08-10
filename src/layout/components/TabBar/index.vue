<template>
  <div v-if="visible" ref="parentRef" class="h-12 tab-bar flex flex-nowrap items-center relative border-bottom py-2">
    <div v-if="isShowBtn" class="scroll-left hover-text border-right" title="向左滑动" @click="clickLeftHandle">
      <icon-left theme="outline" size="16" class="flex items-center" />
    </div>
    <div ref="scrollRef" class="tab-bar-wrapper overflow-hidden relative">
      <TransitionGroup name="list" tag="ul" class="flex flex-no-wrap items-end">
        <TabItem v-for="(item, ind) in tabList" :key="item.id" :item="item" :ind="ind"></TabItem>
      </TransitionGroup>
    </div>

    <div v-if="isShowBtn" class="scroll-right ml-3 hover-text border-left" title="向右滑动" @click="clickRightHandle">
      <icon-right theme="outline" size="16" class="flex items-center" />
    </div>
  </div>
</template>
<script lang="ts" setup>
import { useTabListStore } from '@/store/tab/tabList';
import { useScroll } from '@/hooks/useScroll';
import { storeToRefs } from 'pinia';
import TabItem from './components/TabItem.vue';

const { tabList, visible } = storeToRefs(useTabListStore());
const { scrollRef, parentRef, isShowBtn, clickLeftHandle, clickRightHandle } =
  useScroll(200);
</script>
<style lang="scss" scoped>
.tab-bar {
  z-index: 10;
  position: relative;
  // Chrome-style tab strip: subtle tint over the base background.
  // Uses a neutral semi-transparent overlay that works in both light & dark modes.
  background:
    linear-gradient(to bottom,
      rgba(128, 128, 128, 0.06),
      rgba(128, 128, 128, 0.01)),
    var(--sys-bg-color);
  // Bottom border: the active tab will "break through" this line
  border-bottom: 1px solid var(--sys-border-color);
  padding: 0 8px;
  overflow: visible;

  .scroll-left,
  .scroll-right {
    padding: 0 8px;
    cursor: pointer;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--sys-text-secondary-color);
    transition: color 0.2s ease;
  }

  .scroll-left:hover,
  .scroll-right:hover {
    color: var(--sys-text-color);
  }

  &-wrapper {
    scroll-behavior: smooth;
    overflow-x: auto;
    overflow-y: hidden;
    flex: 1;
    min-height: 100%;
    display: flex;
    align-items: flex-end;

    // Hide the scrollbar for a cleaner Chrome look
    &::-webkit-scrollbar {
      height: 0;
    }
  }
}

:deep(.el-divider--vertical) {
  width: 2px;
  border-left-width: 2px;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s linear;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 关键：顺序变化时的过渡 */
.list-move {
  transition: transform 0.3s linear;
}
</style>
