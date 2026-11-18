<template>
  <div class="tools-panel">
    <el-tabs v-model="activeTool">
      <el-tab-pane label="金价换算" name="gold">
        <GoldConverter />
      </el-tab-pane>
      <el-tab-pane label="计算器" name="calculator">
        <CalculatorTool />
      </el-tab-pane>
    </el-tabs>
    <p class="tools-hint">工具均为本地计算，输入内容不会上传。</p>
  </div>
</template>

<script setup lang="ts">
import GoldConverter from './tools/GoldConverter.vue';
import CalculatorTool from './tools/CalculatorTool.vue';

const activeTool = ref('gold');
</script>

<style lang="scss" scoped>
.tools-panel {
  display: flex;
  flex-direction: column;

  :deep(.el-tabs__content) {
    padding-top: 20px;
  }
}

.tools-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}
</style>
