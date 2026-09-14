<template>
  <AppDialog :visible="props.visible" title="批量上传图片" width="700px" @close="closeHandler" @confirm="confirmHandler">
    <el-alert v-if="!props.categoryList.length" type="warning" :closable="false"
      title="暂无可用的图片分类，请先到「图片分类」中创建后再批量上传" />
    <template v-else>
      <el-form label-width="90px">
        <el-form-item label="图片类型" required>
          <el-select v-model="selectedCategory" placeholder="请选择图片类型" class="!w-full">
            <el-option v-for="item in props.categoryList" :key="item.id" :label="item.name" :value="item.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <el-alert type="info" :closable="false" class="mb-4"
        :title="`本批图片统一使用所选类型；名称取文件名去扩展名后截断至 ${NAME_MAX} 字符，排序 0`" />
      <input ref="fileInputRef" type="file" :accept="ACCEPT" multiple hidden @change="pickFilesHandler" />
      <div class="upload-wrapper border-wrapper border-dashed hover-text hover-border xy-center flex-col py-6"
        :class="{ 'upload-disabled': !selectedCategory }" @click="chooseFilesHandler">
        <AppIcon name="upload" size="24"></AppIcon>
        <span class="text-sm mt-2">点击选择图片，支持多选</span>
      </div>
      <ul v-if="fileList.length" class="file-list-wrapper mt-4">
        <li v-for="item in fileList" :key="item.uid" class="file-item-wrapper border-border rounded relative">
          <div class="file-thumb relative overflow-hidden">
            <div class="file-thumb-blur" :style="{ backgroundImage: `url(${item.url || item.previewUrl})` }"></div>
            <img :src="item.url || item.previewUrl" alt="" class="relative z-1 w-full h-full object-contain" />
          </div>
          <div class="file-info px-2 py-1">
            <div class="text-xs truncate" :title="item.name">{{ item.name }}</div>
            <div class="flex items-center text-xs mt-1" :class="STATUS_MAP[displayStatus(item)].class">
              <AppIcon :name="STATUS_MAP[displayStatus(item)].icon" size="12" class="mr-1"></AppIcon>
              <span>{{ STATUS_MAP[displayStatus(item)].text }}</span>
            </div>
          </div>
          <AppIcon name="close" size="14" class="file-remove hover-text"
            @click.stop="removeFileHandler(item.uid)" title="移除"></AppIcon>
        </li>
      </ul>
    </template>
  </AppDialog>
</template>
<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { nanoid } from 'nanoid';
import { addImageBatchApi } from '@/api/resource/image';
import type { BatchDialogPropsType, BatchFileType, FileStatusType } from '../service.ts';
import { NAME_MAX, ACCEPT } from '../service.ts';
import { MAX_IMAGE_SIZE } from '@/config';

type EmitsType = {
  (e: 'close'): void;
  (e: 'changeSuccess'): void;
};

const props = defineProps<BatchDialogPropsType>();
const emits = defineEmits<EmitsType>();

const STATUS_MAP: Record<FileStatusType, {
  icon: string;
  text: string;
  class: string;
}> = {
  uploading: { icon: 'loading', text: '上传中', class: 'text-gray-400' },
  success: { icon: 'check-one', text: '已上传', class: 'text-green-500' },
  error: { icon: 'error', text: '上传失败', class: 'text-red-500' },
  duplicate: { icon: 'caution', text: '批内名称重复', class: 'text-orange-500' },
};

const fileInputRef = ref<HTMLInputElement>();
const fileList = ref<BatchFileType[]>([]);
// 本批图片统一使用的类型，未选择时不允许上传
const selectedCategory = ref('');

const uploadingCount = computed(
  () => fileList.value.filter((item) => item.status === 'uploading').length
);

// 截断后同名的条目里，只有第 2 个及之后会被后端跳过（首批的保留），
// 这里提前把「会被跳过的那些」标记出来
const duplicateUids = computed(() => {
  const seenNames = new Set<string>();
  const uids = new Set<string>();
  fileList.value.forEach((item) => {
    if (seenNames.has(item.name)) {
      uids.add(item.uid);
    } else {
      seenNames.add(item.name);
    }
  });
  return uids;
});

const displayStatus = (item: BatchFileType): FileStatusType => {
  if (item.status !== 'success') return item.status;
  return duplicateUids.value.has(item.uid) ? 'duplicate' : 'success';
};

const chooseFilesHandler = () => {
  if (!selectedCategory.value) {
    ElMessage.warning('请先选择图片类型');
    return;
  }
  fileInputRef.value?.click();
};

const getImageName = (fileName: string) =>
  fileName.replace(/\.[^.]+$/, '').slice(0, NAME_MAX);

const pickFilesHandler = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = [...(input.files || [])];
  input.value = '';
  files.forEach(uploadFileHandler);
};

const uploadFileHandler = async (file: File) => {
  if (!file.type.startsWith('image/')) {
    ElMessage.error(`${file.name} 不是图片文件`);
    return;
  }
  if (file.size / 1024 / 1024 >= MAX_IMAGE_SIZE) {
    ElMessage.error(`${file.name} 大小不能超过${MAX_IMAGE_SIZE}M`);
    return;
  }
  const item: BatchFileType = {
    uid: nanoid(),
    name: getImageName(file.name),
    url: '',
    previewUrl: URL.createObjectURL(file),
    status: 'uploading',
  };
  fileList.value.push(item);
  const url = await uploadFile(file, file.name, 'image');
  // 上传期间可能已被移除
  const target = fileList.value.find((row) => row.uid === item.uid);
  if (!target) return;
  target.status = url ? 'success' : 'error';
  target.url = url;
};

const removeFileHandler = (uid: string) => {
  const index = fileList.value.findIndex((item) => item.uid === uid);
  if (index === -1) return;
  URL.revokeObjectURL(fileList.value[index].previewUrl);
  fileList.value.splice(index, 1);
};

const clearFileList = () => {
  fileList.value.forEach((item) => URL.revokeObjectURL(item.previewUrl));
  fileList.value = [];
};

const closeHandler = () => {
  clearFileList();
  emits('close');
};

const confirmHandler = async () => {
  if (!selectedCategory.value) {
    ElMessage.warning('请先选择图片类型');
    return;
  }
  if (uploadingCount.value) {
    ElMessage.warning('图片上传中，请稍候');
    return;
  }
  const successList = fileList.value.filter((item) => item.status === 'success');
  if (!successList.length) {
    ElMessage.warning('请先选择并上传图片');
    return;
  }
  try {
    const { data, msg } = await addImageBatchApi({
      category: selectedCategory.value,
      list: successList.map((item) => ({ name: item.name, url: item.url })),
    });
    if (data) {
      ElMessage.success(msg);
      if (data.skipList.length) {
        ElMessage.warning(
          `跳过${data.skipList.length}张：${data.skipList
            .map((item) => `${item.name}（${item.reason}）`)
            .join('、')}`
        );
      }
      emits('changeSuccess');
      closeHandler();
    }
  } catch (err) {
    console.log(err);
  }
};

onBeforeUnmount(() => {
  clearFileList();
});
</script>
<style scoped lang="scss">
// 未选类型时禁止选图，点击提示见 chooseFilesHandler
.upload-disabled {
  opacity: 0.5;
  pointer-events: none;
}

.file-list-wrapper {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.75rem;
  max-height: 320px;
  overflow-y: auto;
}

.file-item-wrapper {
  overflow: hidden;

  .file-thumb {
    width: 100%;
    height: 90px;

    // 同图放大模糊铺底，避免 contain 留白露出白边
    .file-thumb-blur {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      transform: scale(1.15);
      filter: blur(12px) brightness(0.85);
    }
  }

  .file-remove {
    position: absolute;
    top: 4px;
    right: 4px;
    padding: 2px;
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.5);
    color: #fff;
  }
}
</style>
