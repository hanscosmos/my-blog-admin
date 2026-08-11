<template>
  <div class="w-full h-full flex flex-col">
    <div v-if="!editable" class="file-preview-wrapper w-full flex-1 h-0">
      <img v-if="isImage && fileUrl" :src="fileUrl" alt="" class="wh-full" />
      <div v-else-if="fileUrl" class="file-info xy-center flex-col text-gray-500">
        <AppIcon name="file" size="32" />
        <span class="text-sm mt-2">{{ fileName || '已上传文件' }}</span>
      </div>
      <div v-else class="w-full h-full">未上传文件</div>
    </div>
    <div v-else class="w-full flex-1 h-0 hover-text hover-border border-wrapper border-dashed">
      <el-upload class="uploader deep-wrapper-item w-full h-full" :accept="computedAccept"
        :before-upload="computedBeforeUpload" :show-file-list="false" :http-request="uploadFileHandler">
        <template v-if="isImage">
          <img v-if="fileUrl" :src="fileUrl" alt="" class="w-full h-full" />
          <div v-else class="xy-center flex-col w-full h-full">
            <AppIcon name="upload" size="24" title="上传"></AppIcon>
            <span v-if="desc">{{ desc }}</span>
          </div>
        </template>
        <template v-else>
          <div v-if="fileUrl || defaultUrl" class="xy-center flex-col text-gray-500 w-full h-full">
            <AppIcon name="file-pdf" size="32" />
            <span class="text-sm mt-2 truncate max-w-full px-4">{{
              fileName || desc
              }}</span>
            <span class="text-xs text-gray-400 mt-1">点击重新上传</span>
          </div>
          <div v-else class="xy-center flex-col w-full h-full">
            <AppIcon name="upload" size="24" title="上传"></AppIcon>
            <span v-if="desc">{{ desc }}</span>
          </div>
        </template>
      </el-upload>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ElMessage, UploadProps } from 'element-plus';
import { MAX_IMAGE_SIZE } from '@/config';

type PropsType = {
  editable: boolean;
  type: string;
  desc?: string;
  defaultUrl?: string | null;
  /** 接受的文件类型，如 '.pdf'，默认接受图片 */
  accept?: string;
  /** 自定义上传前校验函数，返回 true 允许上传 */
  beforeUpload?: (file: File) => boolean;
  /** 自定义上传处理函数，覆盖默认的 uploadFile */
  onUpload?: (file: File) => Promise<string>;
};
const props = withDefaults(defineProps<PropsType>(), {
  accept: '',
  beforeUpload: undefined,
  onUpload: undefined,
});
const emits = defineEmits(['uploadSuccess']);
const fileUrl = ref<string | null>(null);
const fileName = ref<string>('');

const isImage = computed(() => !props.accept);
const computedAccept = computed(
  () => props.accept || '.jpg,.jpeg,.png,.webp,.svg,.gif'
);

const beforeUploadHandler: UploadProps['beforeUpload'] = (rawFile: File) => {
  if (props.beforeUpload) {
    return props.beforeUpload(rawFile);
  }
  // 默认图片大小校验
  const fileLimit = rawFile.size / 1024 / 1024 < MAX_IMAGE_SIZE;
  if (!fileLimit) {
    ElMessage.error(`上传文件大小不超过${MAX_IMAGE_SIZE}M！`);
  }
  return fileLimit;
};

const computedBeforeUpload = computed(() => beforeUploadHandler);

const uploadFileHandler = async (raw: any) => {
  try {
    let url: string;
    if (props.onUpload) {
      url = await props.onUpload(raw.file);
    } else {
      url = await uploadFile(raw.file, raw.file.name, props.type);
    }
    fileUrl.value = url;
    fileName.value = raw.file.name;
    emits('uploadSuccess', url, raw.file.name);
    ElMessage.success('上传成功');
  } catch {
    ElMessage.error('上传文件失败');
  }
};

onMounted(() => {
  if (props.defaultUrl) {
    fileUrl.value = props.defaultUrl;
    // 从 URL 中提取文件名
    fileName.value = props.defaultUrl.split('/').pop() || '';
  }
});
</script>

<style scoped lang="scss">
:deep(.el-upload) {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
