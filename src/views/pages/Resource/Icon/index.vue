<template>
  <el-tabs v-model="activeTab" class="wh-full flex flex-col">
    <el-tab-pane
      v-for="item in tabList"
      :key="item.key"
      :label="item.label"
      :name="item.key"
      class="wh-full"
      lazy
    >
      <KeepAlive>
        <component :is="item.component"></component>
      </KeepAlive>
    </el-tab-pane>
  </el-tabs>
</template>

<script setup lang="ts">
import IconLib from '@/views/pages/Resource/Icon/pages/IconLib/index.vue';
import IconCategory from '@/views/pages/Resource/Icon/pages/IconCategory/index.vue';

const activeTab = ref('IconLib');
const tabList = [
  {
    label: '图标库',
    key: 'IconLib',
    component: IconLib,
  },
  {
    label: '图标分类',
    key: 'IconCategory',
    component: IconCategory,
  },
];
</script>
<style scoped lang="scss">
:deep(.el-tabs__content) {
  flex: 1;
  height: 0;
}
</style>
