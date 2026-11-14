<template>
  <AppDialog :visible="props.visible" title="调整播放顺序" width="620px" @close="closeHandler"
    @confirm="confirmHandler">
    <div class="sort-tip">拖动歌曲调整顺序，或使用「置顶 / 置底」快速移动，保存后播放器将按此顺序播放。</div>
    <div class="sort-toolbar">
      <el-input v-model="locateKeyword" class="sort-search" placeholder="输入歌名 / 歌手，回车定位"
        clearable @keyup.enter="locateHandler" @clear="locatingId = ''">
        <template #prefix>
          <AppIcon name="search" :size="14" />
        </template>
      </el-input>
      <AppButton type="plain" @click="locateHandler">定位</AppButton>
    </div>
    <div ref="sortWrapperRef" v-loading="loading" class="sort-list-wrapper">
      <ul class="sort-list">
        <li v-for="(song, index) in musicList" :key="song.id"
          :ref="(el) => setItemRef(el, song.id)" class="sort-item"
          :class="{ 'is-dragging': draggingId === song.id, 'is-locating': locatingId === song.id }">
          <span class="sort-index">{{ index + 1 }}</span>
          <div class="sort-cover">
            <img v-if="song.cover" :src="song.cover" alt="" />
            <AppIcon v-else name="music" :size="16" />
          </div>
          <div class="sort-info">
            <div class="sort-name" :title="song.name">{{ song.name }}</div>
            <div class="sort-singer" :title="song.singer">{{ song.singer || '-' }}</div>
          </div>
          <span class="sort-count">{{ song.playCount }} 次播放</span>
          <span class="sort-duration">{{ formatAudioTime(song.duration) }}</span>
          <div class="sort-actions">
            <button type="button" class="sort-action"
              :class="{ 'is-disabled': index === 0 }" title="置顶"
              @click.stop="moveToTop(index)">
              <AppIcon name="to-top" :size="14" />
            </button>
            <button type="button" class="sort-action"
              :class="{ 'is-disabled': index === musicList.length - 1 }" title="置底"
              @click.stop="moveToBottom(index)">
              <AppIcon name="to-bottom" :size="14" />
            </button>
            <AppIcon name="drag" :size="14" class="sort-handle" />
          </div>
        </li>
        <li v-if="!loading && !musicList.length" class="sort-empty">暂无音乐</li>
      </ul>
    </div>
  </AppDialog>
</template>
<script setup lang="ts">
import { ElMessage } from 'element-plus';
import type { ComponentPublicInstance } from 'vue';
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import { getAllMusicApi, sortMusicApi } from '@/api/resource/music';
import type { MusicItemType } from '@/api/resource/music/type';

type PropsType = {
  visible: boolean;
};

type EmitsType = {
  (e: 'close'): void;
  (e: 'changeSuccess'): void;
};

type DragDataType = {
  type: 'music-sort';
  id: string;
};

const props = defineProps<PropsType>();
const emits = defineEmits<EmitsType>();

const loading = ref(false);
const musicList = ref<MusicItemType[]>([]);
const draggingId = ref('');
const sortWrapperRef = ref<HTMLElement | null>(null);
/** 定位搜索关键字与当前高亮的歌曲 */
const locateKeyword = ref('');
const locatingId = ref('');
const itemRefs = new Map<string, HTMLElement>();
let cleanups: Array<() => void> = [];

const locateMatches = computed(() => {
  const keyword = locateKeyword.value.trim().toLowerCase();
  if (!keyword) return [];
  return musicList.value.filter(
    (song) =>
      song.name.toLowerCase().includes(keyword) ||
      (song.singer || '').toLowerCase().includes(keyword)
  );
});

watch(locateKeyword, () => {
  locatingId.value = '';
});

const setItemRef = (el: Element | ComponentPublicInstance | null, id: string) => {
  if (el instanceof HTMLElement) {
    itemRefs.set(id, el);
  } else {
    itemRefs.delete(id);
  }
};

const clearDnd = () => {
  cleanups.forEach((cleanup) => cleanup());
  cleanups = [];
};

const moveSong = (fromId: string, toId: string) => {
  if (fromId === toId) return;
  const fromIndex = musicList.value.findIndex((item) => item.id === fromId);
  const toIndex = musicList.value.findIndex((item) => item.id === toId);
  if (fromIndex < 0 || toIndex < 0) return;
  const next = [...musicList.value];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  musicList.value = next;
};

/** 移动后滚动到列表顶部 / 底部，让结果可见 */
const scrollSortList = (edge: 'top' | 'bottom') => {
  nextTick(() => {
    const wrapper = sortWrapperRef.value;
    if (!wrapper) return;
    wrapper.scrollTo({
      top: edge === 'top' ? 0 : wrapper.scrollHeight,
      behavior: 'smooth',
    });
  });
};

/** 滚动到指定歌曲并高亮 */
const scrollToSong = (id: string) => {
  nextTick(() => {
    const wrapper = sortWrapperRef.value;
    const element = itemRefs.get(id);
    if (!wrapper || !element) return;
    const offset =
      element.getBoundingClientRect().top - wrapper.getBoundingClientRect().top;
    wrapper.scrollTo({
      top: wrapper.scrollTop + offset - 8,
      behavior: 'smooth',
    });
  });
};

/** 回车 / 点击定位；连续定位时在匹配项之间循环 */
const locateHandler = () => {
  const matches = locateMatches.value;
  if (!matches.length) {
    locatingId.value = '';
    ElMessage.info('未找到匹配的歌曲');
    return;
  }
  const currentIndex = matches.findIndex((song) => song.id === locatingId.value);
  const target = matches[(currentIndex + 1) % matches.length];
  locatingId.value = target.id;
  scrollToSong(target.id);
};

const moveToTop = (index: number) => {
  if (index <= 0) return;
  const next = [...musicList.value];
  const [moved] = next.splice(index, 1);
  next.unshift(moved);
  musicList.value = next;
  scrollSortList('top');
};

const moveToBottom = (index: number) => {
  if (index < 0 || index >= musicList.value.length - 1) return;
  const next = [...musicList.value];
  const [moved] = next.splice(index, 1);
  next.push(moved);
  musicList.value = next;
  scrollSortList('bottom');
};

const setupDnd = async () => {
  clearDnd();
  await nextTick();
  // 拖拽到列表上下边缘时自动滚动，便于长距离移动
  const wrapper = sortWrapperRef.value;
  if (wrapper) {
    cleanups.push(autoScrollForElements({ element: wrapper }));
  }
  musicList.value.forEach((song) => {
    const element = itemRefs.get(song.id);
    if (!element) return;
    cleanups.push(
      draggable({
        element,
        getInitialData: (): DragDataType => ({
          type: 'music-sort',
          id: song.id,
        }),
        onDragStart: () => {
          draggingId.value = song.id;
        },
        onDrop: () => {
          draggingId.value = '';
        },
      })
    );
    cleanups.push(
      dropTargetForElements({
        element,
        getData: (): DragDataType => ({ type: 'music-sort', id: song.id }),
        canDrop: ({ source }) => {
          const data = source.data as unknown as DragDataType;
          return data.type === 'music-sort' && data.id !== song.id;
        },
        onDragEnter: ({ source }) => {
          const data = source.data as unknown as DragDataType;
          moveSong(data.id, song.id);
        },
      })
    );
  });
};

const getMusicList = async () => {
  loading.value = true;
  try {
    const { data } = await getAllMusicApi();
    musicList.value = data || [];
    await setupDnd();
  } finally {
    loading.value = false;
  }
};

const closeHandler = () => {
  emits('close');
};

const confirmHandler = async () => {
  if (!musicList.value.length) {
    closeHandler();
    return;
  }
  try {
    const { data, msg } = await sortMusicApi({
      ids: musicList.value.map((item) => item.id),
    });
    if (data) {
      ElMessage.success(msg);
      emits('changeSuccess');
      closeHandler();
    }
  } catch (error) {
    console.log(error);
  }
};

onMounted(() => {
  getMusicList();
});

onBeforeUnmount(() => {
  clearDnd();
  itemRefs.clear();
});
</script>
<style scoped lang="scss">
.sort-tip {
  margin-bottom: 12px;
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

.sort-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.sort-search {
  flex: 1;
}

.sort-list-wrapper {
  max-height: 420px;
  overflow: auto;
}

.sort-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sort-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--sys-border-color);
  border-radius: 8px;
  background: var(--sys-box-bg-color);
  cursor: grab;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--theme-color);
    background: var(--theme-bg);
  }

  &.is-dragging {
    opacity: 0.5;
    cursor: grabbing;
  }

  &.is-locating {
    border-color: var(--theme-color);
    background: var(--theme-bg);
    box-shadow: inset 0 0 0 1px var(--theme-color);
  }
}

.sort-index {
  width: 20px;
  flex-shrink: 0;
  font-size: 12px;
  color: var(--sys-text-secondary-color);
  text-align: center;
}

.sort-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 6px;
  color: var(--sys-text-secondary-color);
  background: var(--sys-bg-color);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.sort-info {
  flex: 1;
  min-width: 0;
}

.sort-name,
.sort-singer {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sort-name {
  font-size: 13px;
  font-weight: 500;
}

.sort-singer,
.sort-count,
.sort-duration {
  font-size: 12px;
  color: var(--sys-text-secondary-color);
}

.sort-count {
  flex-shrink: 0;
}

.sort-duration {
  width: 44px;
  flex-shrink: 0;
  text-align: right;
}

.sort-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 2px;
}

.sort-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--sys-text-secondary-color);
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: var(--theme-color);
    background: var(--sys-bg-color);
  }

  &.is-disabled {
    opacity: 0.25;
    pointer-events: none;
  }
}

.sort-handle {
  flex-shrink: 0;
  color: var(--sys-text-secondary-color);
}

.sort-empty {
  padding: 32px 0;
  font-size: 13px;
  color: var(--sys-text-secondary-color);
  text-align: center;
}
</style>
