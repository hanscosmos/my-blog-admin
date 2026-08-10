<template>
  <div class="tab-item ml-2">
    <el-dropdown trigger="contextmenu" placement="bottom-start" :hide-on-click="true">
      <span ref="tabItemRef" class="tag-item"
        :class="{ 'strong-active-item': currentTab.id === item.id }" @click="selectTabItem(item)">
        <MyIcon :name="item.icon" class="mr-2"></MyIcon>
        <span class="flex-1">{{ item.name }}</span>
        <MyIcon v-if="item.id !== 'Home'" name="close" size="10" class="close-icon hover-weak-wrapper p-2px rounded-sm"
          @click.stop="closeTag(item)"></MyIcon>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item v-for="(menuItem, index) in menuList" :key="index" :disabled="menuItem.disabled(item, ind)"
            @click="menuItem.fn(item)">
            {{ menuItem.title }}</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>
<script lang="ts" setup>
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

import { useTabListStore } from '@/store/tab/tabList';
import { storeToRefs } from 'pinia';
import type { TabItem } from '@/types/type';

type PropsType = {
  item: TabItem;
  ind: number;
};
const props = defineProps<PropsType>();

const tabItemRef = ref();

const {
  closeTag,
  selectTabItem,
  closeBeforeTag,
  closeAfterTag,
  closeOtherTag,
} = useTabListStore();

const { currentTab, tabList } = storeToRefs(useTabListStore());
const menuList = ref([
  {
    title: '关闭标签页',
    disabled: (item: TabItem, _ind: number) => item.id === 'Home',
    fn: (item: TabItem) => {
      closeTag(item);
    },
  },
  {
    title: '关闭左侧标签页',
    fn: (item: TabItem) => {
      closeBeforeTag(item);
    },
    disabled: (_item: TabItem, index: number) => index < 2,
  },
  {
    title: '关闭右侧标签页',
    fn: (item: TabItem) => {
      closeAfterTag(item);
    },
    disabled: (_item: TabItem, index: number) =>
      index === tabList.value.length - 1,
  },
  {
    title: '关闭其他标签页',
    fn: (item: TabItem) => {
      closeOtherTag(item);
    },
    disabled: (_item: TabItem, _index: number) => {
      return tabList.value.length === 1;
    },
  },
  {
    title: '刷新标签页',
    disabled: (_item: TabItem, _ind: number) => false,
    fn: () => {
      window.location.reload();
    },
  },
]);

const initDrag = () => {
  draggable({
    element: tabItemRef.value,
    getInitialData: () => props.item,
    canDrag: () => props.item.id !== 'Home',
    onDragStart: ({ source }) => {
      selectTabItem(source.data as TabItem);
    },
    onDrop: (_args) => {
      tabItemRef.value.classList.remove('dragging');
    },
  });
  dropTargetForElements({
    getData: () => props.item,
    element: tabItemRef.value,
    canDrop() {
      return props.item.id !== 'Home';
    },
    onDragEnter({ self, source }) {
      if (self.data.id !== 'Home' && source.data.id !== 'Home') {
        const selfInd = tabList.value.findIndex(
          (item) => item.id === self.data.id
        );
        const sourceInd = tabList.value.findIndex(
          (item) => item.id === source.data.id
        );
        tabList.value.splice(selfInd, 1, source.data as TabItem);
        tabList.value.splice(sourceInd, 1, self.data as TabItem);
      }
    },
  });
};

onMounted(() => {
  initDrag();
});
</script>
<style lang="scss" scoped>
.tab-item {
  flex-shrink: 0;
  margin-right: 0;

  // Chrome-style tab separators: thin vertical line between tabs
  // Place separator on each tab's right edge, but hide it for:
  // - the active tab itself
  // - the tab immediately before the active tab
  &:not(:last-child) .tag-item {
    &::after {
      content: '';
      position: absolute;
      right: 0;
      top: 25%;
      height: 50%;
      width: 1px;
      background-color: rgba(0, 0, 0, 0.13);
      border-radius: 0.5px;
      z-index: 1;
    }
  }
  // Hide separator on active tab and the tab before it
  &:has(+ .tab-item .strong-active-item) .tag-item::after,
  .tag-item.strong-active-item::after {
    display: none;
  }
}

.tag-item {
  min-width: 140px;
  max-width: 220px;
  font-size: 12px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
  padding: 0 12px;
  border: none;
  // Chrome tabs: rounded top corners, flat bottom that connects to content
  border-radius: 8px 8px 0 0;
  // Inactive: transparent, blending into the tab strip
  background-color: transparent;
  color: rgba(0, 0, 0, 0.5);
  position: relative;
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  z-index: 1;

  // Chrome hover on inactive tab: subtle lightening
  &:hover:not(.strong-active-item) {
    background-color: rgba(0, 0, 0, 0.05);
    color: rgba(0, 0, 0, 0.7);
  }

  // ===== ACTIVE TAB — Chrome style =====
  &.strong-active-item {
    background-color: var(--sys-bg-color, #ffffff);
    color: rgba(0, 0, 0, 0.9);
    margin-top: 0;
    z-index: 5;
    // Sides + top border via box-shadow, bottom stays open
    box-shadow:
      1px 0 0 0 rgba(0, 0, 0, 0.12),
      -1px 0 0 0 rgba(0, 0, 0, 0.12),
      0 -1px 0 0 rgba(0, 0, 0, 0.12);
    // Also lift active tab slightly with a soft shadow
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.04));
  }

  // Bottom connector: covers the tab strip border so the active tab
  // appears to be one piece with the content area below
  &.strong-active-item::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -1px;
    height: 2px;
    background-color: var(--sys-bg-color, #ffffff);
    z-index: 2;
  }

  .flex-1 {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .hover-weak-wrapper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .close-icon,
  .hover-weak-wrapper > .my-icon {
    opacity: 0.4;
    transition: opacity 0.15s ease, background-color 0.15s ease;
  }

  &:hover .close-icon,
  &:hover > .my-icon {
    opacity: 0.75;
  }

  &.strong-active-item .close-icon,
  &.strong-active-item > .my-icon {
    opacity: 0.55;
  }

  &.strong-active-item:hover .close-icon,
  &.strong-active-item:hover > .my-icon {
    opacity: 0.85;
  }

  .close-icon {
    width: 18px;
    height: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .close-icon:hover {
    background-color: rgba(0, 0, 0, 0.1);
    opacity: 1 !important;
  }
}
</style>
