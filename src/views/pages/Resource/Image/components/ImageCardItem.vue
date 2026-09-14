<template>
  <div class="image-card-item wh-full xy-center wrapper-item rounded-md flex flex-col overflow-hidden">
    <div class="image-box w-full flex-1 h-0 relative overflow-hidden">
      <!-- 同图放大模糊铺底，避免 contain 留白露出白边 -->
      <div class="image-blur" :style="{ backgroundImage: `url(${item.url})` }"></div>
      <el-image ref="imageRef" :src="item.url" fit="contain" :preview-src-list="previewList"
        :initial-index="previewIndex" preview-teleported title="点击查看"
        class="image-preview wh-full cursor-pointer" />
    </div>
    <div class="option-btn flex items-center py-3 w-full">
      <div class="flex-1 xy-center">
        <el-button link @click="viewHandler">
          <AppIcon name="preview-open" class="mr-2"></AppIcon>
          查 看
        </el-button>
      </div>

      <el-divider direction="vertical"></el-divider>
      <div class="flex-1 xy-center">
        <el-button v-perm="'resource:image:update'" link type="primary" @click="emits('edit', item)">
          <AppIcon name="edit" class="mr-2"></AppIcon>
          编 辑
        </el-button>
      </div>

      <el-divider direction="vertical"></el-divider>
      <div class="flex-1 xy-center">
        <el-button v-perm="'resource:image:delete'" link type="danger" @click="emits('delete', item)">
          <AppIcon name="delete" class="mr-2"></AppIcon>
          删 除
        </el-button>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ImageItemType } from '@/api/resource/image/type';

type PropsType = {
  item: ImageItemType;
  /** 当前列表的全部图片地址，用于预览时左右切换 */
  previewList: string[];
};
const props = defineProps<PropsType>();

const emits = defineEmits<{
  (e: 'edit', item: ImageItemType): void;
  (e: 'delete', item: ImageItemType): void;
}>();

const previewIndex = computed(() => props.previewList.indexOf(props.item.url));
const imageRef = ref();

const viewHandler = () => {
  imageRef.value?.showPreview();
};
</script>
<style lang="scss" scoped>
// el-image 默认按容器拉伸，这里靠 fit="contain" 保持原始宽高比；
// 留白由 .image-blur 垫底填充，所以 el-image 自身不能再有背景色，否则会盖住垫底层
.image-preview {
  position: relative;
  z-index: 1;
}

.image-blur {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  // 放大后再模糊，避免模糊把边缘透出底色
  transform: scale(1.15);
  filter: blur(16px) brightness(0.85);
}
</style>
