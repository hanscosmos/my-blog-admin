<template>
  <div class="app-layout-wrapper flex flex-col wh-full">
    <div class="top-bar-wrapper">
      <TopBar></TopBar>
    </div>
    <div class="main-wrapper flex-1 h-0 flex">
      <div class="side-bar-wrapper" :style="{ width: sideWidth }">
        <SideBar v-if="!route.meta.hideSide"></SideBar>
      </div>
      <div class="flex flex-col flex-1 w-0">
        <div class="h-16">
          <TabBar v-if="!route.meta.hideTab"></TabBar>
        </div>
        <div class="content-wrapper flex-1 h-0 overflow-auto">
          <div v-if="isOpenStore" class="wh-full overflow-auto">
            <RouterView v-slot="{ Component, route }">
              <keep-alive :exclude="disabledStoreRoutes">
                <component :is="Component" :key="route.fullPath"></component>
              </keep-alive>
            </RouterView>
          </div>
          <div v-else class="wh-full overflow-auto">
            <RouterView></RouterView>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import SideBar from './components/SideBar/index.vue';
import TopBar from './components/TopBar/index.vue';
import TabBar from './components/TabBar/index.vue';
import { useSystemStore } from '@/store/system';

const route = useRoute();
const { isSideExpand, isOpenStore } = storeToRefs(useSystemStore());
const disabledStoreRoutes = ['ArticleDetail', 'UpdateArticle', 'Home'];
const sideWidth = computed(() => {
  return isSideExpand.value ? '14rem' : '4rem';
});
</script>
<style lang="scss" scoped>
.app-layout-wrapper {
  .side-bar-wrapper {
    transition: all ease 0.2s;
  }
  .content-wrapper {
    background-color: var(--sys-bg-color);
  }

  .top-bar-wrapper {
    height: 4rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
