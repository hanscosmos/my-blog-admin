<template>
  <div class="tab-item ml-4">
    <el-dropdown
      trigger="contextmenu"
      placement="bottom-start"
      :hide-on-click="true"
    >
      <span
        ref="tabItemRef"
        class="tag-item wrapper-item rounded-lg transition-all hover-weak-wrapper px-3 border-border"
        :class="{ 'strong-active-item': currentTab.id === item.id }"
        @click="selectTabItem(item)"
      >
        <MyIcon :name="item.icon" class="mr-2"></MyIcon>
        <span class="flex-1">{{ item.name }}</span>
        <MyIcon
          v-if="item.id !== 'Home'"
          name="close"
          size="10"
          class="hover-weak-wrapper p-2px rounded-sm"
          @click.stop="closeTag(item)"
        ></MyIcon>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-for="(menuItem, index) in menuList"
            :key="index"
            :disabled="menuItem.disabled(item, ind)"
            @click="menuItem.fn(item)"
          >
            {{ menuItem.title }}</el-dropdown-item
          >
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
}
.tag-item {
  width: 170px;
  font-size: 12px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: start;
  flex-shrink: 0;
  cursor: pointer;
  transition: all linear 0.2s;

  .close-icon {
    transform: scale(0.7, 0.7);
    padding: 3px;
    border-radius: 4px;
    transition: all 0.15s linear;

    &:hover {
      transform: scale(0.8);
    }
  }
}
</style>
