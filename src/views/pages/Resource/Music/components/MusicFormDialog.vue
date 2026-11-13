<template>
  <AppDialog :visible="props.visible" :title="dialogTitle" width="680px" @close="closeHandler"
    @confirm="confirmHandler">
    <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px"
      :style="{ width: '100%' }">
      <el-form-item prop="name" label="歌曲名">
        <el-input v-model="form.name" placeholder="请输入歌曲名" maxlength="64" show-word-limit />
      </el-form-item>
      <el-form-item prop="singer" label="歌手">
        <el-input v-model="form.singer" placeholder="请输入歌手" maxlength="64" />
      </el-form-item>
      <el-form-item prop="language" label="语种">
        <el-select v-model="form.language" placeholder="请选择语种（可选）" clearable
          class="w-full">
          <el-option v-for="item in languageOptions" :key="item.key" :label="item.value"
            :value="item.key"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item prop="genre" label="风格">
        <el-select v-model="form.genre" placeholder="请选择风格（可选）" clearable class="w-full">
          <el-option v-for="item in genreOptions" :key="item.key" :label="item.value"
            :value="item.key"></el-option>
        </el-select>
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
        <div class="w-full">
          <div class="w-full h-180px">
            <AppImageAutoUpload type="music-cover" :default-url="form.cover" :editable="true"
              desc="点击上传封面（可选）"
              @upload-success="coverUploadSuccessHandler"></AppImageAutoUpload>
          </div>
          <div v-if="extractingEmbedded" class="mt-2 text-xs"
            style="color: var(--sys-text-secondary-color)">
            正在解析音频内嵌信息…
          </div>
        </div>
      </el-form-item>
      <el-form-item prop="lyric" label="歌词">
        <div class="w-full">
          <div class="flex items-center gap-2 mb-2">
            <el-upload ref="lyricUploadRef" :accept="LYRIC_ACCEPT" :auto-upload="false"
              :show-file-list="false" :on-change="lyricFileChangeHandler">
              <AppButton type="plain">
                <AppIcon name="upload" class="mr-1" :size="14"></AppIcon>
                <span>上传歌词文件</span>
              </AppButton>
            </el-upload>
            <span class="text-xs" style="color: var(--sys-text-secondary-color)">
              支持 .lrc / .txt，可留空；无时间戳时按纯文本展示
            </span>
            <AppButton v-if="form.lyric" type="text" class="ml-auto"
              @click="clearLyricHandler">清除</AppButton>
          </div>
          <el-input v-model="form.lyric" type="textarea" :rows="6" :maxlength="MAX_LYRIC_LENGTH"
            show-word-limit resize="vertical"
            placeholder="可上传 LRC 文件自动填入，也可直接粘贴歌词；歌词为选填项"></el-input>
        </div>
      </el-form-item>
    </el-form>
  </AppDialog>
</template>
<script setup lang="ts">
import { ElMessage } from 'element-plus';
import type { UploadFile, UploadInstance } from 'element-plus';
import AppImageAutoUpload from '@/components/common/Upload/AppImageAutoUpload/index.vue';
import { addMusicApi, editMusicApi } from '@/api/resource/music';
import type { MusicFormType, MusicItemType } from '@/api/resource/music/type';
import { MAX_IMAGE_SIZE, MAX_MUSIC_SIZE } from '@/config';
import {
  MUSIC_GENRE_DICT_CODE,
  MUSIC_LANGUAGE_DICT_CODE,
} from '@/config/dict';
import { useDict } from '@/hooks/useDict';
import {
  AUDIO_ACCEPT,
  LYRIC_ACCEPT,
  MAX_LYRIC_FILE_SIZE,
  MAX_LYRIC_LENGTH,
  formRules,
  getFormByRow,
  originalForm,
} from '../service';
import { extractEmbeddedMusicInfo } from '../embedded';

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

const LYRIC_EXTENSIONS = LYRIC_ACCEPT.split(',').map((item) =>
  item.replace('.', '').toLowerCase()
);

const props = defineProps<PropsType>();
const emits = defineEmits<EmitsType>();

const { dictDataList: languageOptions, getDictDataList: getLanguageList } =
  useDict(MUSIC_LANGUAGE_DICT_CODE);
const { dictDataList: genreOptions, getDictDataList: getGenreList } =
  useDict(MUSIC_GENRE_DICT_CODE);

const formRef = ref();
const form = ref<MusicFormType>(
  props.optType === 'edit'
    ? getFormByRow(props.row)
    : { ...originalForm }
);

const dialogTitle = computed(() =>
  props.optType === 'add' ? '新建音乐' : '编辑音乐'
);

const extractingEmbedded = ref(false);
let pendingAudioFile: File | null = null;
/** 防止连续换歌时旧的解析结果覆盖新表单 */
let audioTaskId = 0;

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
  pendingAudioFile = file;
  return true;
};

/**
 * 根据文件名解析歌手与歌曲名，约定格式：歌手 - 歌曲名。
 * onlyEmpty 用于新建时让音频内嵌标签优先。
 */
const fillNameByFileName = (fileName: string, onlyEmpty = false) => {
  const dotIndex = fileName.lastIndexOf('.');
  const baseName = (dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName).trim();
  if (!baseName) return;
  const separator = baseName.includes(' - ') ? ' - ' : '-';
  const parts = baseName.split(separator);
  if (parts.length > 1) {
    const singer = parts[0].trim();
    const name = parts.slice(1).join(separator).trim();
    if (singer && (!onlyEmpty || !form.value.singer)) {
      form.value.singer = singer;
    }
    if (name && (!onlyEmpty || !form.value.name)) {
      form.value.name = name;
    }
    return;
  }
  if (!onlyEmpty || !form.value.name) {
    form.value.name = baseName;
  }
};

/** 读取音频标签中的封面、歌名、歌手与歌词，仅在对应字段为空时回填 */
const fillByEmbeddedInfo = async (file: File, taskId: number) => {
  extractingEmbedded.value = true;
  let filled = false;
  let coverImported = false;
  try {
    const info = await extractEmbeddedMusicInfo(file);
    if (taskId !== audioTaskId) return;
    if (!form.value.name && info.name) {
      form.value.name = info.name;
      filled = true;
    }
    if (!form.value.singer && info.singer) {
      form.value.singer = info.singer;
      filled = true;
    }
    if (!form.value.lyric && info.lyric) {
      form.value.lyric = info.lyric.slice(0, MAX_LYRIC_LENGTH);
      filled = true;
    }
    if (info.coverFile && !form.value.cover) {
      const coverUrl = await uploadFile(
        info.coverFile,
        info.coverFile.name,
        'music-cover'
      );
      if (taskId !== audioTaskId) return;
      if (coverUrl) {
        form.value.cover = coverUrl;
        filled = true;
        coverImported = true;
      }
    } else if (info.coverTooLarge) {
      ElMessage.warning(`内嵌封面超过${MAX_IMAGE_SIZE}M，请手动上传封面`);
    }
    if (coverImported) {
      ElMessage.success('已自动提取并上传内嵌封面');
    } else if (filled) {
      ElMessage.success('已自动填入音频内嵌信息');
    }
  } catch {
    // 无标签或格式不支持时静默忽略，不影响正常保存
  } finally {
    if (taskId === audioTaskId) {
      extractingEmbedded.value = false;
    }
  }
};

const audioUploadSuccessHandler = async (url: string, fileName: string) => {
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

  const file = pendingAudioFile;
  pendingAudioFile = null;
  const taskId = ++audioTaskId;
  if (file) {
    await fillByEmbeddedInfo(file, taskId);
  }
  if (taskId !== audioTaskId) return;
  // 新建时内嵌标签优先，编辑时保留原有「文件名覆盖」行为
  fillNameByFileName(fileName, props.optType === 'add');
};

const coverUploadSuccessHandler = (url: string) => {
  form.value.cover = url;
};

const lyricUploadRef = ref<UploadInstance>();

/** 歌词文件多为 UTF-8，部分中文 LRC 为 GBK，按 UTF-8 解码失败时回退 */
const readLyricText = async (file: File) => {
  const buffer = await file.arrayBuffer();
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder('gbk').decode(buffer);
  }
};

const lyricFileChangeHandler = async (uploadFile: UploadFile) => {
  const file = uploadFile.raw;
  // 清空选择记录，便于重复选择同一个文件
  lyricUploadRef.value?.clearFiles();
  if (!file) return;
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!LYRIC_EXTENSIONS.includes(extension)) {
    ElMessage.error(`仅支持 ${LYRIC_ACCEPT} 格式的歌词文件`);
    return;
  }
  if (file.size / 1024 > MAX_LYRIC_FILE_SIZE) {
    ElMessage.error(`歌词文件大小不得超过${MAX_LYRIC_FILE_SIZE}KB`);
    return;
  }
  try {
    const text = (await readLyricText(file)).replace(/^﻿/, '');
    if (text.length > MAX_LYRIC_LENGTH) {
      form.value.lyric = text.slice(0, MAX_LYRIC_LENGTH);
      ElMessage.warning(`歌词超过${MAX_LYRIC_LENGTH}字，已截断`);
      return;
    }
    form.value.lyric = text;
  } catch {
    ElMessage.error('歌词文件读取失败，请检查文件内容');
  }
};

const clearLyricHandler = () => {
  form.value.lyric = '';
};

/** 新建音乐时默认选中字典第一项（国语 / 流行），编辑时保留原值 */
onMounted(async () => {
  await Promise.all([getLanguageList(), getGenreList()]);
  if (props.optType !== 'add') return;
  if (!form.value.language && languageOptions.value.length) {
    form.value.language = languageOptions.value[0].key;
  }
  if (!form.value.genre && genreOptions.value.length) {
    form.value.genre = genreOptions.value[0].key;
  }
});

const closeHandler = () => {
  audioTaskId += 1;
  pendingAudioFile = null;
  extractingEmbedded.value = false;
  form.value = { ...originalForm };
  emits('close');
};

const confirmHandler = () => {
  if (extractingEmbedded.value) {
    ElMessage.warning('正在解析音频内嵌信息，请稍候');
    return;
  }
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
