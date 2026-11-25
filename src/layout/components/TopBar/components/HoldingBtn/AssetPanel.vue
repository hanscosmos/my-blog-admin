<template>
  <el-tabs v-model="activeTab" class="asset-tabs">
    <el-tab-pane label="金融资产" name="financial">
      <FinancialAssetPanel ref="financialRef" />
    </el-tab-pane>
    <el-tab-pane label="实物资产" name="physical" lazy>
      <PhysicalAssetPanel ref="physicalRef" />
    </el-tab-pane>
  </el-tabs>
</template>

<script setup lang="ts">
import FinancialAssetPanel from './components/FinancialAssetPanel.vue';
import PhysicalAssetPanel from './components/PhysicalAssetPanel.vue';

type PanelExposeType = {
  updateTime: string;
  stale: boolean;
  ready: boolean;
  loading: boolean;
  refresh: () => void;
  exportImage: () => Promise<void> | void;
};

const activeTab = ref<'financial' | 'physical'>('financial');
const financialRef = ref<PanelExposeType | null>(null);
const physicalRef = ref<PanelExposeType | null>(null);

/** 顶部工具按钮只作用于当前页签，避免实物与金融数据互相影响 */
const activePanel = computed(() =>
  activeTab.value === 'financial' ? financialRef.value : physicalRef.value
);

const updateTime = computed(() => activePanel.value?.updateTime ?? '');
const stale = computed(() => activePanel.value?.stale ?? false);
const ready = computed(() => activePanel.value?.ready ?? false);
const loading = computed(() => activePanel.value?.loading ?? false);

const refresh = () => {
  activePanel.value?.refresh();
};

const exportImage = async () => {
  await activePanel.value?.exportImage();
};

defineExpose({
  updateTime,
  stale,
  ready,
  loading,
  refresh,
  exportImage,
});
</script>

<style lang="scss" scoped>
.asset-tabs {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

:deep(.el-tabs__header) {
  flex: none;
  margin-bottom: 6px;
}

:deep(.el-tabs__content) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding-top: 16px;
}

:deep(.el-tab-pane) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}
</style>
