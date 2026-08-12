<template>
  <div class="w-full h-full">
    <!-- 上传触发区域 -->
    <div
      class="upload-trigger wh-full xy-center flex-col cursor-pointer rounded-full overflow-hidden border-2 border-dashed hover-border transition-all border-gray-300 hover:border-blue-400"
      @click="triggerFileInput"
    >
      <!-- 已有头像预览 -->
      <img
        v-if="currentUrl"
        :src="currentUrl"
        alt=""
        class="wh-full object-cover rounded-full"
      />
      <!-- 未上传时的占位 -->
      <div v-else class="xy-center flex-col text-gray-400">
        <AppIcon name="upload" size="24" title="上传头像"></AppIcon>
        <span v-if="desc" class="text-xs mt-1">{{ desc }}</span>
      </div>
    </div>

    <!-- 隐藏的文件选择器 -->
    <input
      ref="fileInputRef"
      type="file"
      accept=".jpg,.jpeg,.png,.webp"
      class="hidden"
      @change="onFileChange"
    />

    <!-- 裁剪弹窗 -->
    <AppAvatarCropper ref="cropperRef" @cropped="onCropped" />
  </div>
</template>
<script lang="ts" setup>
import { ElMessage } from 'element-plus';
import { MAX_IMAGE_SIZE } from '@/config';
import { uploadFile } from '@/utils/tool';
import AppAvatarCropper from './AppAvatarCropper.vue';

type PropsType = {
  desc?: string;
  defaultUrl?: string | null;
};

const props = withDefaults(defineProps<PropsType>(), {
  desc: '上传头像',
  defaultUrl: null,
});

const emit = defineEmits<{
  (e: 'uploadSuccess', url: string): void;
}>();

const fileInputRef = ref<HTMLInputElement>();
const cropperRef = ref<InstanceType<typeof AppAvatarCropper>>();
const currentUrl = ref<string | null>(null);

const triggerFileInput = () => {
  fileInputRef.value?.click();
};

const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  // 文件大小校验
  const fileLimit = file.size / 1024 / 1024 < MAX_IMAGE_SIZE;
  if (!fileLimit) {
    ElMessage.error(`上传文件大小不超过${MAX_IMAGE_SIZE}M！`);
    // 重置 input，以便可以再次选择同一文件
    input.value = '';
    return;
  }

  // 生成临时 URL 并打开裁剪弹窗
  const objectUrl = URL.createObjectURL(file);
  cropperRef.value?.open(objectUrl);

  // 重置 input
  input.value = '';
};

const onCropped = async (blob: Blob) => {
  try {
    // 将裁剪后的 Blob 转为 File 并上传
    const croppedFile = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
    const url = await uploadFile(croppedFile, croppedFile.name, 'avatar');
    if (url) {
      currentUrl.value = url;
      emit('uploadSuccess', url);
    }
  } catch {
    ElMessage.error('上传头像失败');
  }
};

onMounted(() => {
  if (props.defaultUrl) {
    currentUrl.value = props.defaultUrl;
  }
});
</script>
<style lang="scss" scoped></style>
