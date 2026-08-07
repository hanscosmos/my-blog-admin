<template>
  <div class="resume-edit p-4">
    <div class="resume-upload-area">
      <div class="w-full h-48">
        <MyImageAutoUpload
          type="resume"
          :desc="resumeFileName || '上传简历'"
          editable
          accept=".pdf"
          :default-url="resumeFileUrl"
          :before-upload="beforeUpload"
          @upload-success="uploadSuccessHandler"
        />
      </div>
    </div>

    <div v-if="resumeFileUrl" class="flex gap-2 mt-3">
      <el-button type="primary" @click="previewResume">
        <my-icon name="eyes" size="14" class="mr-1" />
        预览
      </el-button>
      <el-button type="danger" @click="deleteResume">
        <my-icon name="delete" size="14" class="mr-1" />
        删除
      </el-button>
    </div>

    <div class="text-gray-400 text-sm mt-2">
      仅支持 PDF 格式，文件大小不超过 5MB
    </div>
  </div>
</template>

<script lang="ts" setup>
import MyImageAutoUpload from '@/components/common/Upload/MyImageAutoUpload/index.vue';

const props = defineProps<{
  resumeFileUrl: string;
  resumeFileName: string;
}>();

const emit = defineEmits<{
  'update:resumeFileUrl': [value: string];
  'update:resumeFileName': [value: string];
  save: [];
}>();

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const beforeUpload = (file: File) => {
  if (file.type !== 'application/pdf') {
    ElMessage.error('仅支持 PDF 格式文件');
    return false;
  }
  if (file.size > MAX_SIZE) {
    ElMessage.error('文件大小不能超过 5MB');
    return false;
  }
  return true;
};

const uploadSuccessHandler = (url: string, name: string) => {
  emit('update:resumeFileUrl', url);
  emit('update:resumeFileName', name);
  emit('save');
};

const previewResume = () => {
  if (props.resumeFileUrl) {
    window.open(props.resumeFileUrl, '_blank');
  }
};

const deleteResume = () => {
  emit('update:resumeFileUrl', '');
  emit('update:resumeFileName', '');
  emit('save');
  ElMessage.success('已删除');
};
</script>
