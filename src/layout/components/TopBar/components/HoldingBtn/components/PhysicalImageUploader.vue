<template>
  <div class="physical-image-uploader">
    <div class="image-block">
      <div class="image-label">封面图</div>
      <div class="cover-box">
        <AppImageAutoUpload
          editable
          type="physical"
          desc="上传封面"
          :default-url="cover"
          @upload-success="handleCoverSuccess"
        />
      </div>
      <el-button
        v-if="cover"
        link
        type="danger"
        size="small"
        @click="emit('update:cover', '')"
        >清除封面</el-button
      >
    </div>

    <div class="image-block">
      <div class="image-label">
        实拍图
        <span class="image-tip">最多 9 张，点击缩略图可预览</span>
      </div>
      <el-upload
        v-model:file-list="fileList"
        list-type="picture-card"
        accept=".jpg,.jpeg,.png,.webp,.gif"
        :limit="MAX_PHYSICAL_IMAGES"
        :http-request="handleUpload"
        :before-upload="beforeUpload"
        :on-remove="handleRemove"
        :on-preview="handlePreview"
        :on-exceed="handleExceed"
      >
        <div class="upload-add">
          <AppIcon name="plus" :size="18" />
          <span>上传</span>
        </div>
      </el-upload>
    </div>

    <Teleport to="body">
      <el-image-viewer
        v-if="previewIndex >= 0"
        :url-list="images"
        :initial-index="previewIndex"
        @close="previewIndex = -1"
      />
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  ElImageViewer,
  ElMessage,
  type UploadProps,
  type UploadUserFile,
} from 'element-plus';
import { MAX_IMAGE_SIZE } from '@/config';
import { uploadFile } from '@/utils/tool';

const MAX_PHYSICAL_IMAGES = 9;

const props = defineProps<{
  cover: string;
  images: string[];
}>();

const emit = defineEmits<{
  (e: 'update:cover', value: string): void;
  (e: 'update:images', value: string[]): void;
}>();

const fileList = ref<UploadUserFile[]>([]);
const previewIndex = ref(-1);

watch(
  () => props.images,
  (images) => {
    fileList.value = images.map((url, index) => ({
      name: `实拍图 ${index + 1}`,
      url,
    }));
  },
  { immediate: true, deep: true }
);

const handleCoverSuccess = (url: string) => {
  emit('update:cover', url);
};

const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const fileLimit = file.size / 1024 / 1024 < MAX_IMAGE_SIZE;
  if (!fileLimit) {
    ElMessage.error(`上传文件大小不超过${MAX_IMAGE_SIZE}M！`);
  }
  return fileLimit;
};

const handleUpload: UploadProps['httpRequest'] = async (options) => {
  const file = options.file as File;
  const url = await uploadFile(file, file.name, 'physical');
  if (!url) {
    const error = Object.assign(new Error('上传失败'), {
      status: 0,
      method: 'POST',
      url: '',
    });
    options.onError?.(
      error as Parameters<NonNullable<typeof options.onError>>[0]
    );
    return;
  }
  emit('update:images', [...props.images, url]);
  options.onSuccess?.(url);
};

const handleRemove: UploadProps['onRemove'] = (file) => {
  emit(
    'update:images',
    props.images.filter((url) => url !== file.url)
  );
};

const handlePreview: UploadProps['onPreview'] = (file) => {
  const index = props.images.indexOf(file.url ?? '');
  previewIndex.value = index >= 0 ? index : 0;
};

const handleExceed = () => {
  ElMessage.warning(`最多上传 ${MAX_PHYSICAL_IMAGES} 张图片`);
};
</script>

<style lang="scss" scoped>
.physical-image-uploader {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 28px;
  width: 100%;
}

.image-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.image-label {
  font-size: 13px;
  color: var(--sys-text-secondary-color);
}

.image-tip {
  font-size: 11px;
  color: var(--sys-text-secondary-color);
}

.cover-box {
  width: 148px;
  height: 148px;
  overflow: hidden;
  border-radius: 6px;
}

.upload-add {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

:deep(.el-upload--picture-card),
:deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 100px;
  height: 100px;
}
</style>
