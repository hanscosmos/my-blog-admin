<template>
  <el-tabs>
    <el-tab-pane v-for="item in tabList" :key="item.key" :label="item.label">
      <RouterView></RouterView>
    </el-tab-pane>
  </el-tabs>
</template>

<script setup lang="ts">
const tabList = [
  {
    label: '图标库',
    key: 'iconLib',
  },
  {
    label: '图标分类',
    key: 'iconCategory',
  },
];
</script>
<style scoped lang="scss"></style>
