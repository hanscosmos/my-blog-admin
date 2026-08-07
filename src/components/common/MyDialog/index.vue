<template>
  <div class="my-dialog w-full h-full">
    <el-dialog
      :model-value="visible"
      draggable
      :title="title"
      :width="width"
      title-align="start"
      :before-close="cancelHandler"
      @close="cancelHandler"
    >
      <template #header>
        <slot name="header"></slot>
      </template>
      <div>
        <slot></slot>
      </div>
      <template v-if="!hideFooter" #footer>
        <div class="flex items-center">
          <my-button type="plain" class="mr-4" @click="cancelHandler"
            >取消</my-button
          >
          <my-button type="default" @click="confirmHandler">确定</my-button>
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
};

withDefaults(defineProps<PropsType>(), {
  width: '40%',
  hideFooter: false,
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
</style>
