<template>
  <div
    class="image-card-item wh-full xy-center wrapper-item rounded-md flex flex-col overflow-hidden"
  >
    <div class="w-full flex-1 h-0">
      <img :src="item.url" alt="" class="wh-full" />
    </div>
    <div class="option-btn flex items-center py-3 w-full">
      <div class="flex-1 xy-center">
        <el-button link type="primary" @click="emits('edit', item)">
          <MyIcon name="edit" class="mr-2"></MyIcon>
          编 辑
        </el-button>
      </div>

      <el-divider direction="vertical"></el-divider>
      <div class="flex-1 xy-center">
        <el-button link type="danger" @click="emits('delete', item)">
          <MyIcon name="delete" class="mr-2"></MyIcon>
          删 除
        </el-button>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ImageItemType } from '@/api/resource/image/type';

type PropsType = { item: ImageItemType };
defineProps<PropsType>();

const emits = defineEmits<{
  (e: 'edit', item: ImageItemType): void;
  (e: 'delete', item: ImageItemType): void;
}>();
</script>
<style lang="scss" scoped></style>
