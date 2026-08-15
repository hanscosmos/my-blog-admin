<template>
  <div class="mood-panel w-full flex flex-col text-left mt-2">
    <!-- 输入区 -->
    <div class="mood-editor">
      <el-input v-model="moodText" type="textarea" :rows="3" resize="none" maxlength="200" show-word-limit
        placeholder="此刻心情…" />

      <!-- 已选图片 -->
      <div v-if="pickedImages.length" class="flex flex-wrap gap-1 mt-2">
        <div v-for="(img, index) in pickedImages" :key="index" class="relative w-12 h-12 rounded overflow-hidden">
          <img :src="img" alt="" class="w-full h-full object-cover" />
          <span class="mood-img-remove" @click="removePickedImage(index)">×</span>
        </div>
      </div>

      <!-- 操作行 -->
      <div class="flex items-center mt-2">
        <el-popover placement="bottom-start" :width="180" trigger="click">
          <template #reference>
            <span class="mood-action-btn" :class="{ 'is-active': selectedMood }" title="情绪">
              <span v-if="selectedMood" class="text-base leading-none">{{ selectedMood }}</span>
              <AppIcon v-else name="emotion-happy" size="16" />
            </span>
          </template>
          <div class="emoji-grid">
            <span v-for="emoji in EMOJI_LIST" :key="emoji" class="emoji-item"
              :class="{ 'is-active': selectedMood === emoji }" @click="toggleEmoji(emoji)">{{ emoji }}</span>
          </div>
        </el-popover>

        <span class="mood-action-btn ml-2" title="图片" @click="triggerPickImage">
          <AppIcon name="camera" size="16" />
        </span>

        <el-button type="primary" size="small" class="ml-auto" :loading="publishing" @click="publishHandler">
          发布
        </el-button>
      </div>
      <input ref="fileInputRef" type="file" accept="image/*" multiple hidden @change="onPickImages" />
    </div>

    <!-- 历史列表 -->
    <div class="mood-history mt-2 max-h-60 overflow-y-auto">
      <div v-for="item in dataList" :key="item.id" class="mood-item py-2 border-bottom">
        <div>
          <p class="text-sm text-gray-700 dark:text-gray-200 break-all leading-5 flex-1">{{ item.content }}
            <span v-if="item.mood">{{ item.mood }}</span>

          </p>
        </div>
        <div v-if="item.images?.length" class="flex flex-wrap gap-1 mt-1">
          <el-image v-for="(img, index) in item.images" :key="index" :src="img" :preview-src-list="item.images"
            :initial-index="index" fit="cover" class="w-14 h-14 rounded cursor-pointer" />
        </div>
        <div class="flex items-center mt-1 text-xs text-gray-400">
          <span>{{ dateDiff(item.createTime) }}前</span>
          <span class="ml-auto cursor-pointer hover-text" @click="deleteMoodHandler(item)">删除</span>
        </div>
      </div>
      <div v-if="loading" class="py-3 text-center text-xs text-gray-400">加载中...</div>
      <div v-else-if="dataList.length >= total" class="py-3 text-center text-xs text-gray-400">没有更多了</div>
      <div v-else class="py-3 text-center text-xs text-gray-400 cursor-pointer hover-text" @click="loadMoreHandler">
        加载更多
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { addUserMoodApi, deleteUserMoodApi, getUserMoodListApi } from '@/api/user';
import type { UserMoodType } from '@/api/user/type';
import { useSearch } from '@/hooks/useSearch';
import { MAX_IMAGE_SIZE } from '@/config';
import emitter from '@/utils/eventBus';

const EMOJI_LIST = ['😄', '😌', '😢', '😠', '🤩', '😰', '🥱', '🤔'];

const moodText = ref('');
const selectedMood = ref<string | null>(null);
const pickedImages = ref<string[]>([]);
const publishing = ref(false);
const fileInputRef = ref<HTMLInputElement>();

const {
  loading,
  dataList,
  total,
  pageConfig,
  getDataListHandler,
  initDataListHandler,
} = useSearch<object, UserMoodType>({}, getUserMoodListApi, 10, true);

const toggleEmoji = (emoji: string) => {
  selectedMood.value = selectedMood.value === emoji ? null : emoji;
};

const triggerPickImage = () => {
  fileInputRef.value?.click();
};

const onPickImages = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const files = Array.from(input.files || []);
  input.value = '';
  for (const file of files) {
    if (file.size / 1024 / 1024 >= MAX_IMAGE_SIZE) {
      ElMessage.error(`图片大小不能超过${MAX_IMAGE_SIZE}M`);
      continue;
    }
    const url = await uploadFile(file, file.name, 'mood');
    if (url) pickedImages.value.push(url);
  }
};

const removePickedImage = (index: number) => {
  pickedImages.value.splice(index, 1);
};

const publishHandler = async () => {
  const content = moodText.value.trim();
  if (!content && !pickedImages.value.length) {
    ElMessage.warning('文字和图片至少填写一个');
    return;
  }
  publishing.value = true;
  try {
    const res = await addUserMoodApi({
      content,
      mood: selectedMood.value,
      images: pickedImages.value,
    });
    if (res.code === 0) {
      ElMessage.success('发布成功');
      moodText.value = '';
      selectedMood.value = null;
      pickedImages.value = [];
      initDataListHandler();
      emitter.emit('user:stats-refresh');
    }
  } finally {
    publishing.value = false;
  }
};

const loadMoreHandler = () => {
  pageConfig.pageNumber += 1;
  getDataListHandler();
};

const deleteMoodHandler = async (item: UserMoodType) => {
  const res = await deleteUserMoodApi({ ids: [item.id] });
  if (res.code === 0) {
    ElMessage.success('删除成功');
    initDataListHandler();
  }
};

onMounted(() => {
  initDataListHandler();
});
</script>

<style lang="scss" scoped>
.emoji-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.emoji-item {
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;

  &:hover {
    background: var(--sys-wrapper-bg-color);
  }

  &.is-active {
    background: var(--sys-wrapper-bg-color);
  }
}

.mood-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--sys-text-secondary-color);

  &:hover {
    background: var(--sys-wrapper-bg-color);
  }

  &.is-active {
    color: var(--sys-text-color);
  }
}

.mood-img-remove {
  position: absolute;
  top: 0;
  right: 0;
  width: 16px;
  height: 16px;
  line-height: 14px;
  text-align: center;
  font-size: 12px;
  color: #fff;
  background: rgba(0, 0, 0, 0.5);
  cursor: pointer;

  &:hover {
    background: rgba(0, 0, 0, 0.7);
  }
}
</style>
