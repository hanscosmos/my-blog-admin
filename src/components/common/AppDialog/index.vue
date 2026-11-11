<template>
  <div class="app-dialog w-full h-full">
    <el-dialog :model-value="visible" :draggable="!fullscreen" :title="title" :width="width" :fullscreen="fullscreen"
      title-align="start" :before-close="cancelHandler" @close="cancelHandler">
      <template #header>
        <slot name="header"></slot>
      </template>
      <div>
        <slot></slot>
      </div>
      <template v-if="!hideFooter" #footer>
        <div class="flex items-center">
          <app-button type="plain" class="mr-4" @click="cancelHandler">取消</app-button>
          <app-button type="default" @click="confirmHandler">确定</app-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
<script lang="ts" setup>
type PropsType = {
  title: string;
  visible: boolean;
  width?: string;
  hideFooter?: boolean;
  fullscreen?: boolean;
};

withDefaults(defineProps<PropsType>(), {
  width: '40%',
  hideFooter: false,
  fullscreen: false,
});

const emit = defineEmits(['confirm', 'close']);

const cancelHandler = () => {
  emit('close');
};

const confirmHandler = () => {
  emit('confirm');
};
</script>
<style lang="scss" scoped>
:deep(.el-dialog__header) {
  border-bottom: solid 1px var(--sys-border-color);
  margin-bottom: 1rem;
  padding: 0 1rem;
  height: 3rem;
  display: flex;
  align-items: center;
}

:deep(.el-dialog__title) {
  font-size: 15px;
  font-family: YouSheBiaoTiHei, serif;
}

:deep(.el-dialog__body) {
  padding: 0 2rem;
}

:deep(.el-dialog__footer) {
  border-top: solid 1px var(--sys-border-color);
  padding: 1rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.el-dialog) {
  padding: 0;
}

// 全屏模式下让 body 撑满剩余高度，内容区自行滚动
:deep(.el-dialog.is-fullscreen) {
  display: flex;
  flex-direction: column;
  margin: 0;
}

:deep(.el-dialog.is-fullscreen .el-dialog__body) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

:deep(.el-dialog.is-fullscreen .el-dialog__body > div) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}
</style>
