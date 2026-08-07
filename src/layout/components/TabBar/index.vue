<template>
  <div
    v-if="visible"
    ref="parentRef"
    class="h-full tab-bar flex flex-nowrap items-center relative border-bottom py-2"
  >
    <div
      v-if="isShowBtn"
      class="scroll-left hover-text border-right"
      title="向左滑动"
      @click="clickLeftHandle"
    >
      <icon-left theme="outline" size="16" class="flex items-center" />
    </div>
    <div ref="scrollRef" class="tab-bar-wrapper overflow-hidden relative">
      <TransitionGroup
        name="list"
        tag="ul"
        class="flex flex-no-wrap items-center"
      >
        <TabItem
          v-for="(item, ind) in tabList"
          :key="item.id"
          :item="item"
          :ind="ind"
        ></TabItem>
      </TransitionGroup>
    </div>

    <div
      v-if="isShowBtn"
      class="scroll-right ml-3 hover-text border-left"
      title="向右滑动"
      @click="clickRightHandle"
    >
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
  height: 4rem;
  z-index: 10;
  position: relative;

  .scroll-left,
  .scroll-right {
    padding: 0 8px;
    cursor: pointer;
    height: 47px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &-wrapper {
    scroll-behavior: smooth;
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
