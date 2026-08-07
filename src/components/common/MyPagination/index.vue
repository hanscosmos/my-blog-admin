<template>
  <div
    class="wh-full my-pagination flex justify-between items-center"
    :class="{ hideSize: hideSize, hideJump: hideJump }"
  >
    <span class="text-sm"
      >总计<span class="text-blue-500 mx-2">{{ total }}</span
      >条数据</span
    >
    <el-pagination
      :current-page="pageNumber"
      :page-size="pageSize"
      :pager-count="pageCount"
      :page-sizes="[10, 20, 30, 50]"
      :background="background"
      :small="isSmall"
      :total="total"
      layout="sizes, prev, pager, next, jumper"
      @size-change="
        (val: number) => pageChangeHandle({ pageNumber, pageSize: val })
      "
      @current-change="
        (val: number) => pageChangeHandle({ pageNumber: val, pageSize })
      "
      :hide-on-single-page="hideOnePage"
    ></el-pagination>
  </div>
</template>
<script setup lang="ts">
type PropsType = {
  isSmall?: boolean;
  background?: boolean;
  total: number;
  pageNumber: number;
  pageSize: number;
  pageCount?: number;
  hideSize?: boolean;
  hideJump?: boolean;
  hideOnePage?: boolean;
};
withDefaults(defineProps<PropsType>(), {
  isSmall: false,
  background: true,
  pageCount: 5,
  hideSize: false,
  hideJump: false,
  hideOnePage: false,
});

type EmitsType = {
  (e: 'pageChange', pageConfig: PageType): void;
};
const emits = defineEmits<EmitsType>();

const pageChangeHandle = (page: PageType) => {
  emits('pageChange', page);
};
</script>
<style scoped lang="scss">
.hideSize {
  :deep(.el-pagination__sizes) {
    display: none;
  }
}

.hideJump {
  :deep(.el-pagination__jump) {
    display: none;
  }
}
</style>
