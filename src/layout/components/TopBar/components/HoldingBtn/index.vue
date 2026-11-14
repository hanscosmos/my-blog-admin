<template>
  <div
    v-if="isSuper"
    class="hover-text flex flex-col items-center cursor-pointer"
    @click="visible = true"
  >
    <AppIcon name="funds" :size="16"></AppIcon>
    <span class="text-xs mt-1">我的持仓</span>
  </div>

  <Teleport v-if="isSuper" to="body">
    <AppDialog
      :visible="visible"
      title="我的持仓"
      width="min(1200px, 94vw)"
      fullscreen
      hide-footer
      @close="closeHandler"
    >
      <template #header>
        <div class="holding-dialog-header">
          <span class="holding-dialog-title">我的持仓</span>
          <div class="holding-dialog-meta">
            <span v-if="panelRef?.updateTime">
              更新于 {{ panelRef.updateTime }}
            </span>
            <span v-if="panelRef?.stale" class="text-amber-500">
              数据可能延迟
            </span>
            <button
              type="button"
              class="holding-icon-action"
              title="刷新"
              :disabled="panelRef?.loading"
              @click="refresh"
            >
              <AppIcon
                name="refresh"
                :size="16"
                :class="{ 'animate-spin': panelRef?.loading }"
              ></AppIcon>
            </button>
          </div>
        </div>
      </template>
      <MarketAssetPanel v-if="visible" ref="panelRef" />
    </AppDialog>
  </Teleport>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { usePermissionStore } from '@/store/permission';
import MarketAssetPanel from './components/MarketAssetPanel.vue';

// 与市场行情一致：仅超级管理员可见
const { isSuper } = storeToRefs(usePermissionStore());

const visible = ref(false);

type AssetPanelExposeType = {
  updateTime: string;
  stale: boolean;
  loading: boolean;
  refresh: () => void;
};

const panelRef = ref<AssetPanelExposeType | null>(null);

const closeHandler = () => {
  visible.value = false;
};

const refresh = () => {
  panelRef.value?.refresh();
};
</script>

<style lang="scss" scoped>
.holding-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding-right: 2rem;
}

.holding-dialog-title {
  font-size: 15px;
  font-family: YouSheBiaoTiHei, serif;
  color: var(--sys-text-color);
}

.holding-dialog-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

.holding-icon-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out;

  &:hover:not(:disabled) {
    color: var(--el-color-primary);
    background-color: var(--theme-hover);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}
</style>
