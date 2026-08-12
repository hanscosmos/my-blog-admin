<template>
  <el-dialog
    :model-value="visible"
    title="裁剪头像"
    :width="520"
    :before-close="closeHandler"
    @close="closeHandler"
    title-align="start"
  >
    <div class="crop-wrapper flex justify-center rounded-lg overflow-hidden bg-gray-100">
      <img
        ref="imageRef"
        :src="imageUrl"
        alt=""
        class="block max-w-full"
        style="max-height: 400px"
      />
    </div>
    <template #footer>
      <div class="flex items-center justify-end">
        <app-button type="plain" class="mr-4" @click="closeHandler">取消</app-button>
        <app-button type="default" @click="cropHandler">确认</app-button>
      </div>
    </template>
  </el-dialog>
</template>
<script lang="ts" setup>
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';

const visible = ref(false);
const imageUrl = ref('');

const imageRef = ref<HTMLImageElement>();
let cropperInstance: Cropper | null = null;

const emit = defineEmits<{
  (e: 'cropped', blob: Blob): void;
}>();

const destroyCropper = () => {
  if (cropperInstance) {
    cropperInstance.destroy();
    cropperInstance = null;
  }
};

const open = (url: string) => {
  imageUrl.value = url;
  visible.value = true;
  nextTick(() => {
    destroyCropper();
    if (imageRef.value) {
      cropperInstance = new Cropper(imageRef.value, {
        aspectRatio: 1,
        viewMode: 1,
        dragMode: 'move',
        autoCropArea: 0.8,
        guides: true,
        center: true,
        background: false,
        modal: true,
        movable: true,
        zoomable: true,
        rotatable: false,
        scalable: true,
      });
    }
  });
};

const closeHandler = () => {
  visible.value = false;
  destroyCropper();
  // 释放临时 object URL
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value);
    imageUrl.value = '';
  }
};

const cropHandler = () => {
  if (!cropperInstance) return;
  const canvas = cropperInstance.getCroppedCanvas({
    width: 200,
    height: 200,
    imageSmoothingQuality: 'high',
  });
  canvas.toBlob(
    (blob) => {
      if (blob) {
        emit('cropped', blob);
      }
      closeHandler();
    },
    'image/jpeg',
    0.9,
  );
};

defineExpose({ open });
</script>
<style lang="scss" scoped>
.crop-wrapper {
  // cropperjs 在暗色背景上效果最好
  img {
    // cropperjs 需要 img 的父容器不干扰其尺寸计算
  }
}
</style>
