<template>
  <AppDialog :visible="props.visible" :title="dialogTitle" width="560px" @close="closeHandler"
    @confirm="confirmHandler">
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px"
      :style="{ width: '100%' }">
      <el-form-item prop="name" label="歌曲名">
        <el-input v-model="form.name" placeholder="请输入歌曲名" maxlength="64" show-word-limit />
      </el-form-item>
      <el-form-item prop="singer" label="歌手">
        <el-input v-model="form.singer" placeholder="请输入歌手" maxlength="64" />
      </el-form-item>
      <el-form-item prop="url" label="音频文件">
        <div class="w-full h-140px">
          <AppImageAutoUpload type="music" :accept="AUDIO_ACCEPT" file-icon="music"
            :default-url="form.url" :editable="true" desc="点击上传音频文件"
            :before-upload="beforeAudioUpload"
            @upload-success="audioUploadSuccessHandler"></AppImageAutoUpload>
        </div>
      </el-form-item>
      <el-form-item prop="duration" label="时长（秒）">
        <div class="flex items-center w-full">
          <el-input-number v-model="form.duration" :min="0" :max="86400"
            controls-position="right" class="!w-160px" />
          <span class="ml-3 text-xs" style="color: var(--sys-text-secondary-color)">
            上传后自动识别，可手动修正
          </span>
        </div>
      </el-form-item>
      <el-form-item prop="cover" label="封面">
        <div class="w-full h-180px">
          <AppImageAutoUpload type="music-cover" :default-url="form.cover" :editable="true"
            desc="点击上传封面（可选）"
            @upload-success="coverUploadSuccessHandler"></AppImageAutoUpload>
        </div>
      </el-form-item>
    </el-form>
  </AppDialog>
</template>
<script setup lang="ts">
import { ElMessage } from 'element-plus';
import AppImageAutoUpload from '@/components/common/Upload/AppImageAutoUpload/index.vue';
import { addMusicApi, editMusicApi } from '@/api/resource/music';
import type { MusicFormType, MusicItemType } from '@/api/resource/music/type';
import { MAX_MUSIC_SIZE } from '@/config';
import {
  AUDIO_ACCEPT,
  formRules,
  getFormByRow,
  originalForm,
} from '../service';

type PropsType = {
  visible: boolean;
  optType: string;
  row: MusicItemType;
};

type EmitsType = {
  (e: 'close'): void;
  (e: 'changeSuccess'): void;
};

const AUDIO_EXTENSIONS = AUDIO_ACCEPT.split(',').map((item) =>
  item.replace('.', '').toLowerCase()
);

const props = defineProps<PropsType>();
const emits = defineEmits<EmitsType>();

const formRef = ref();
const form = ref<MusicFormType>(
  props.optType === 'edit'
    ? getFormByRow(props.row)
    : { ...originalForm }
);

const dialogTitle = computed(() =>
  props.optType === 'add' ? '新建音乐' : '编辑音乐'
);

const beforeAudioUpload = (file: File) => {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!AUDIO_EXTENSIONS.includes(extension)) {
    ElMessage.error(`仅支持 ${AUDIO_ACCEPT} 格式的音频`);
    return false;
  }
  if (file.size / 1024 / 1024 >= MAX_MUSIC_SIZE) {
    ElMessage.error(`音频文件大小不得超过${MAX_MUSIC_SIZE}M`);
    return false;
  }
  return true;
};

const audioUploadSuccessHandler = (url: string) => {
  form.value.url = url;
  const audio = new Audio();
  audio.preload = 'metadata';
  audio.onloadedmetadata = () => {
    if (Number.isFinite(audio.duration)) {
      form.value.duration = Math.round(audio.duration);
    }
  };
  audio.src = url;
  audio.load();
};

const coverUploadSuccessHandler = (url: string) => {
  form.value.cover = url;
};

const closeHandler = () => {
  form.value = { ...originalForm };
  emits('close');
};

const confirmHandler = () => {
  formRef.value.validate(async (valid: boolean) => {
    if (!valid) return;
    try {
      const { data, msg } =
        props.optType === 'add'
          ? await addMusicApi(form.value)
          : await editMusicApi({ id: props.row.id, ...form.value });
      if (data) {
        ElMessage.success(msg);
        emits('changeSuccess');
        closeHandler();
      }
    } catch (error) {
      console.log(error);
    }
  });
};
</script>
<style scoped lang="scss"></style>
