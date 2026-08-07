<template>
  <div class="my-search-panel wh-full flex flex-col">
    <div v-if="!hideHeader" class="my-search-panel-header p-4 border-bottom">
      <slot name="header"></slot>
    </div>

    <div class="my-search-panel-body flex-1 h-0 overflow-auto">
      <div
        v-if="loading || dataExist"
        v-loading="loading"
        class="data-container wh-full"
      >
        <slot></slot>
      </div>
      <div v-else class="wh-full">
        <my-empty-data></my-empty-data>
      </div>
    </div>
    <div v-if="!hideBottom" class="my-search-panel-footer p-4">
      <slot name="footer"></slot>
    </div>
  </div>
</template>
<script lang="ts" setup>
type PropsType = {
  hideHeader?: boolean;
  hideBottom?: boolean;
  dataExist: boolean;
  loading: boolean;
};
withDefaults(defineProps<PropsType>(), {
  hideHeader: false,
  hideBottom: false,
});
</script>
<style lang="scss" scoped></style>
