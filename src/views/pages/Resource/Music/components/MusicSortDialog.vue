<template>
  <AppDialog :visible="props.visible" title="调整播放顺序" width="620px" @close="closeHandler"
    @confirm="confirmHandler">
    <div class="sort-tip">拖动歌曲调整顺序，保存后播放器将按此顺序播放。</div>
    <div v-loading="loading" class="sort-list-wrapper">
      <ul class="sort-list">
        <li v-for="(song, index) in musicList" :key="song.id"
          :ref="(el) => setItemRef(el, song.id)" class="sort-item"
          :class="{ 'is-dragging': draggingId === song.id }">
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
          <AppIcon name="drag" :size="14" class="sort-handle" />
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
const itemRefs = new Map<string, HTMLElement>();
let cleanups: Array<() => void> = [];

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

const setupDnd = async () => {
  clearDnd();
  await nextTick();
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
