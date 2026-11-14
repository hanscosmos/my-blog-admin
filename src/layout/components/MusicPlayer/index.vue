<template>
  <div class="music-player">
    <transition name="music-fade">
      <div v-if="!collapsed" class="player-card">
        <div class="player-header">
          <div class="cover" :class="{ 'is-playing': isPlaying }">
            <img v-if="currentSong?.cover" :src="currentSong.cover" alt="" />
            <div v-else class="cover-placeholder">
              <AppIcon name="music" :size="20" color="#fff" />
            </div>
          </div>
          <div class="song-info">
            <div class="song-name" :title="currentSong?.name">
              {{ currentSong?.name || '暂无播放' }}
            </div>
            <div class="song-singer" :title="currentSong?.singer">
              {{ currentSong?.singer || '选择一首歌开始' }}
            </div>
          </div>
          <div class="header-actions">
            <button class="icon-btn" :class="{ 'is-active': lyricVisible }"
              :title="lyricVisible ? '收起歌词' : '显示歌词'" @click="toggleLyric">
              <AppIcon name="notes" :size="16" />
            </button>
            <button class="icon-btn" :class="{ 'is-active': playlistVisible }" title="播放列表"
              @click="togglePlaylist">
              <AppIcon name="music-list" :size="16" />
            </button>
            <button class="icon-btn" title="收起" @click="collapseHandler">
              <AppIcon name="down" :size="16" />
            </button>
          </div>
        </div>

        <div class="progress-row">
          <span class="time">{{ formatAudioTime(progressSeconds) }}</span>
          <el-slider class="progress-slider" :model-value="progressSeconds" :max="duration || 1" :show-tooltip="false"
            @input="seekingHandler" @change="seekHandler" />
          <span class="time">{{ formatAudioTime(duration) }}</span>
        </div>

        <div class="control-row">
          <button class="icon-btn mode-btn" :title="modeTitle" @click="toggleMode">
            <AppIcon :name="modeIcon" :size="16" />
          </button>
          <button class="icon-btn" title="上一首" @click="musicStore.prev(filteredPlaylist)">
            <AppIcon name="go-start" :size="18" />
          </button>
          <button class="play-btn" :title="isPlaying ? '暂停' : '播放'" @click="musicStore.toggle()">
            <AppIcon :name="isPlaying ? 'pause' : 'play'" :size="20" color="#fff" />
          </button>
          <button class="icon-btn" title="下一首" @click="musicStore.next(filteredPlaylist)">
            <AppIcon name="go-end" :size="18" />
          </button>
          <div class="volume-box">
            <AppIcon :name="volumeIcon" :size="16" />
            <el-slider class="volume-slider" :model-value="volume * 100" :show-tooltip="false" @input="volumeHandler" />
          </div>
        </div>

        <div class="panel-viewport" :class="{ 'is-open': lyricVisible || playlistVisible }">
          <transition name="music-playlist">
            <div v-if="lyricVisible" class="lyric-panel">
              <div v-if="!currentSong" class="lyric-empty">暂无播放</div>
              <div v-else-if="!parsedLyric.lines.length" class="lyric-empty">
                该歌曲暂未上传歌词
              </div>
              <ul v-else ref="lyricListRef" class="lyric-list" @wheel="pauseLyricFollow"
                @touchmove="pauseLyricFollow">
                <li v-for="(line, index) in parsedLyric.lines" :key="`${line.time}-${index}`"
                  class="lyric-line"
                  :class="{ 'is-active': isActiveLyric(line), 'is-clickable': parsedLyric.synced }"
                  @click="seekToLyric(line)">
                  {{ line.text }}
                </li>
              </ul>
            </div>
          </transition>

          <transition name="music-playlist">
            <div v-if="playlistVisible" class="playlist-panel">
              <div class="playlist-header">
                <el-input v-if="searchVisible" v-model="filterKeyword" class="playlist-search-input"
                  placeholder="搜索歌曲 / 歌手" size="small" clearable autofocus @keyup.esc="toggleSearch"></el-input>
                <span v-else>播放列表（{{ playlistCountText }}）</span>
                <div class="playlist-actions">
                  <button class="playlist-action-btn" :class="{ 'is-active': searchVisible }" title="搜索"
                    @click="toggleSearch">
                    <AppIcon name="search" :size="14" />
                  </button>
                  <el-popover placement="bottom-end" :width="260" trigger="click" popper-class="music-filter-popover">
                    <template #reference>
                      <button class="playlist-action-btn" :class="{ 'is-active': isFilterActive }" title="筛选语种 / 风格">
                        <AppIcon name="filter" :size="14" />
                      </button>
                    </template>
                    <div class="filter-popover">
                      <div class="filter-section">
                        <div class="filter-section-title">语种</div>
                        <div class="filter-options">
                          <button class="filter-option" :class="{ 'is-active': !filterLanguage }"
                            @click="filterLanguage = ''">
                            全部
                          </button>
                          <button v-for="item in languageOptions" :key="item.key" class="filter-option"
                            :class="{ 'is-active': filterLanguage === item.key }"
                            @click="toggleLanguageFilter(item.key)">
                            {{ item.value }}
                          </button>
                        </div>
                      </div>
                      <div class="filter-section">
                        <div class="filter-section-title">风格</div>
                        <div class="filter-options">
                          <button class="filter-option" :class="{ 'is-active': !filterGenre }" @click="filterGenre = ''">
                            全部
                          </button>
                          <button v-for="item in genreOptions" :key="item.key" class="filter-option"
                            :class="{ 'is-active': filterGenre === item.key }" @click="toggleGenreFilter(item.key)">
                            {{ item.value }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </el-popover>
                  <AppIcon name="refresh" :size="14" class="hover-text" @click="musicStore.loadPlaylist(true)" />
                </div>
              </div>
              <ul class="playlist">
                <li v-for="song in filteredPlaylist" :key="song.id" class="playlist-item"
                  :class="{ 'is-active': song.id === currentSong?.id }" @click="musicStore.playSong(song)">
                  <div class="playlist-cover">
                    <img v-if="song.cover" :src="song.cover" alt="" />
                    <AppIcon v-else name="music" :size="15" />
                  </div>
                  <div class="playlist-info">
                    <span class="playlist-name" :title="song.name">{{
                      song.name
                      }}</span>
                    <span class="playlist-singer" :title="getSongMeta(song)">{{
                      getSongMeta(song)
                      }}</span>
                  </div>
                  <!-- <span class="playlist-count">{{ song.playCount }}次</span> -->
                  <span class="playlist-duration">{{
                    formatAudioTime(song.duration)
                    }}</span>
                </li>
                <li v-if="!filteredPlaylist.length" class="playlist-empty">
                  {{
                    playlist.length
                      ? '没有符合条件的歌曲'
                      : '暂无音乐，请先在资源管理中上传'
                  }}
                </li>
              </ul>
            </div>
          </transition>
        </div>
      </div>
    </transition>

    <button v-if="collapsed" class="collapsed-btn" :class="{ 'is-playing': isPlaying }" title="打开音乐播放器"
      @click="collapsed = false">
      <AppIcon name="music" :size="22" color="#fff" />
    </button>

    <audio ref="audioRef" preload="metadata" @timeupdate="handleTimeUpdate" @play="handlePlay" @pause="handlePause"
      @ended="handleEnded" @error="handleError" @loadedmetadata="handleLoadedMetadata"></audio>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { ElMessage } from 'element-plus';
import { useMusicStore, type MusicPlayModeType } from '@/store/music';
import {
  addMusicListenSecondsApi,
  flushMusicListenSecondsKeepalive,
  playMusicApi,
} from '@/api/resource/music';
import type { MusicItemType } from '@/api/resource/music/type';
import { MUSIC_GENRE_DICT_CODE, MUSIC_LANGUAGE_DICT_CODE } from '@/config/dict';
import { useDict } from '@/hooks/useDict';
import {
  findLyricIndex,
  parseLyric,
  type LyricLineType,
} from './lyric';

const musicStore = useMusicStore();
const { playlist, currentSong, isPlaying, volume, mode, collapsed } =
  storeToRefs(musicStore);
const { dictDataList: languageOptions, getDictDataList: getLanguageList } =
  useDict(MUSIC_LANGUAGE_DICT_CODE);
const { dictDataList: genreOptions, getDictDataList: getGenreList } = useDict(
  MUSIC_GENRE_DICT_CODE
);

const audioRef = ref<HTMLAudioElement | null>(null);
const progressSeconds = ref(0);
const duration = ref(0);
const isSeeking = ref(false);
const playlistVisible = ref(false);
const filterKeyword = ref('');
const filterLanguage = ref('');
const filterGenre = ref('');
const searchVisible = ref(false);

const lyricVisible = ref(false);
const lyricListRef = ref<HTMLElement | null>(null);
/** 用户手动滚动歌词后暂停自动跟随 */
const followLyric = ref(true);
let followTimer: ReturnType<typeof setTimeout> | null = null;

const parsedLyric = computed(() => parseLyric(currentSong.value?.lyric));
const activeLyricIndex = computed(() =>
  parsedLyric.value.synced
    ? findLyricIndex(parsedLyric.value.lines, progressSeconds.value)
    : -1
);
const activeLyricTime = computed(() => {
  const index = activeLyricIndex.value;
  return index >= 0 ? parsedLyric.value.lines[index].time : -1;
});
/** 同一时间戳的多行（原文 / 翻译）一起高亮 */
const isActiveLyric = (line: LyricLineType) =>
  parsedLyric.value.synced && line.time === activeLyricTime.value;

const filteredPlaylist = computed(() => {
  const keyword = filterKeyword.value.trim().toLowerCase();
  return playlist.value.filter((song) => {
    if (filterLanguage.value && song.language !== filterLanguage.value) {
      return false;
    }
    if (filterGenre.value && song.genre !== filterGenre.value) {
      return false;
    }
    if (!keyword) return true;
    return (
      song.name.toLowerCase().includes(keyword) ||
      song.singer.toLowerCase().includes(keyword)
    );
  });
});

const isFilterActive = computed(
  () => !!filterLanguage.value || !!filterGenre.value
);

const isPlaylistFiltered = computed(
  () => !!filterKeyword.value.trim() || isFilterActive.value
);

/** 收起搜索框时清空关键字，避免隐藏的筛选条件让人困惑 */
const toggleSearch = () => {
  searchVisible.value = !searchVisible.value;
  if (!searchVisible.value) {
    filterKeyword.value = '';
  }
};

/** 再次点击已选中的语种 / 风格可取消筛选 */
const toggleLanguageFilter = (key: string) => {
  filterLanguage.value = filterLanguage.value === key ? '' : key;
};

const toggleGenreFilter = (key: string) => {
  filterGenre.value = filterGenre.value === key ? '' : key;
};

const playlistCountText = computed(() =>
  isPlaylistFiltered.value
    ? `${filteredPlaylist.value.length}/${playlist.value.length}`
    : `${playlist.value.length}`
);

/** 播放列表中的歌手 / 语种 / 风格摘要 */
const getSongMeta = (song: MusicItemType) => {
  const language = getDictLabelByKey(languageOptions.value, song.language);
  const genre = getDictLabelByKey(genreOptions.value, song.genre);
  return [song.singer || '-', language, genre].filter(Boolean).join(' · ');
};

let pendingSeconds = 0;
let lastTickTime = 0;
let playCounted = false;
let flushTimer: ReturnType<typeof setInterval> | null = null;
let preloadAudio: HTMLAudioElement | null = null;
let preloadedUrl = '';

const modeList: MusicPlayModeType[] = ['list', 'single', 'shuffle'];
const modeMetaMap = {
  list: { icon: 'play-cycle', title: '列表循环' },
  single: { icon: 'play-once', title: '单曲循环' },
  shuffle: { icon: 'shuffle-one', title: '随机播放' },
};
const modeIcon = computed(() => modeMetaMap[mode.value].icon);
const modeTitle = computed(() => modeMetaMap[mode.value].title);
const volumeIcon = computed(() => {
  if (volume.value <= 0) return 'volume-mute';
  return volume.value < 0.5 ? 'volume-small' : 'volume-up';
});

const collapseHandler = () => {
  playlistVisible.value = false;
  lyricVisible.value = false;
  collapsed.value = true;
};

/** 播放列表与歌词面板互斥，避免卡片过高 */
const togglePlaylist = () => {
  playlistVisible.value = !playlistVisible.value;
  if (playlistVisible.value) {
    lyricVisible.value = false;
  }
};

const toggleLyric = () => {
  lyricVisible.value = !lyricVisible.value;
  if (lyricVisible.value) {
    playlistVisible.value = false;
  }
};

/** 把当前歌词行滚动到列表中间 */
const scrollActiveLyric = () => {
  const container = lyricListRef.value;
  const index = activeLyricIndex.value;
  if (!lyricVisible.value || !followLyric.value || !container || index < 0) {
    return;
  }
  const line = container.children[index] as HTMLElement | undefined;
  if (!line) return;
  // 用相对视口的位置计算，避免 li 的 offsetParent 不是滚动容器
  const offset =
    line.getBoundingClientRect().top -
    container.getBoundingClientRect().top -
    (container.clientHeight - line.offsetHeight) / 2;
  container.scrollTo({
    top: container.scrollTop + offset,
    behavior: isPlaying.value ? 'smooth' : 'auto',
  });
};

/** 手动滚动后 5 秒内不自动跟随 */
const pauseLyricFollow = () => {
  followLyric.value = false;
  if (followTimer) clearTimeout(followTimer);
  followTimer = setTimeout(() => {
    followLyric.value = true;
  }, 5000);
};

const seekToLyric = (line: LyricLineType) => {
  const audio = audioRef.value;
  if (!parsedLyric.value.synced || !audio || line.time < 0) return;
  audio.currentTime = line.time;
  progressSeconds.value = line.time;
  lastTickTime = line.time;
  followLyric.value = true;
};

watch([activeLyricIndex, lyricVisible, followLyric], () => {
  if (!lyricVisible.value) return;
  nextTick(scrollActiveLyric);
});

watch(
  () => currentSong.value?.id,
  () => {
    followLyric.value = true;
    if (followTimer) {
      clearTimeout(followTimer);
      followTimer = null;
    }
    nextTick(() => {
      if (lyricListRef.value) {
        lyricListRef.value.scrollTop = 0;
      }
      scrollActiveLyric();
    });
  }
);

/** 把已累计的收听秒数上报；keepalive 用于页面隐藏/关闭 */
const flushStat = (songId = currentSong.value?.id, keepalive = false) => {
  const seconds = Math.floor(pendingSeconds);
  if (!songId || seconds <= 0) return;
  pendingSeconds -= seconds;
  const song = playlist.value.find((item) => item.id === songId);
  if (song) {
    song.listenSeconds += seconds;
  }
  if (keepalive) {
    flushMusicListenSecondsKeepalive(songId, seconds);
    return;
  }
  addMusicListenSecondsApi({ id: songId, seconds }).catch(() => {
    pendingSeconds += seconds;
    if (song) {
      song.listenSeconds = Math.max(0, song.listenSeconds - seconds);
    }
  });
};

const playAudio = async () => {
  const audio = audioRef.value;
  if (!audio) return;
  try {
    await audio.play();
  } catch {
    isPlaying.value = false;
  }
};

const restartCurrent = () => {
  const audio = audioRef.value;
  if (!audio) return;
  pendingSeconds = 0;
  lastTickTime = 0;
  playCounted = false;
  progressSeconds.value = 0;
  audio.currentTime = 0;
  playAudio();
};

const handleTimeUpdate = () => {
  const audio = audioRef.value;
  if (!audio) return;
  const current = audio.currentTime;
  const delta = current - lastTickTime;
  // 正常播放时增量很小；跳转进度会突然变大，直接丢弃避免误记
  if (!isSeeking.value && delta > 0 && delta <= 2) {
    pendingSeconds += delta;
    if (pendingSeconds >= 15) {
      flushStat();
    }
  }
  lastTickTime = current;
  if (!isSeeking.value) {
    progressSeconds.value = current;
  }
};

const handleLoadedMetadata = () => {
  const audio = audioRef.value;
  if (!audio) return;
  duration.value = Number.isFinite(audio.duration)
    ? audio.duration
    : currentSong.value?.duration || 0;
};

const handlePlay = () => {
  if (playCounted || !currentSong.value) return;
  playCounted = true;
  currentSong.value.playCount += 1;
  playMusicApi({ id: currentSong.value.id }).catch(() => {
    if (currentSong.value) {
      currentSong.value.playCount = Math.max(
        0,
        currentSong.value.playCount - 1
      );
    }
    playCounted = false;
  });
};

const handlePause = () => {
  flushStat();
};

const handleEnded = () => {
  flushStat();
  if (!playlist.value.length) return;
  // 筛选后仅剩一首时同样直接重播
  const activeList = filteredPlaylist.value.length
    ? filteredPlaylist.value
    : playlist.value;
  if (mode.value === 'single' || activeList.length === 1) {
    restartCurrent();
    return;
  }
  musicStore.next(activeList);
};

const handleError = () => {
  isPlaying.value = false;
  ElMessage.error('音频加载失败，请检查文件是否可以访问');
};

type SliderValue = number | number[];
const toNumber = (value: SliderValue) =>
  Array.isArray(value) ? value[0] : value;

const seekingHandler = (value: SliderValue) => {
  isSeeking.value = true;
  progressSeconds.value = toNumber(value);
};

const seekHandler = (value: SliderValue) => {
  const audio = audioRef.value;
  const seekValue = toNumber(value);
  progressSeconds.value = seekValue;
  isSeeking.value = false;
  if (!audio) return;
  audio.currentTime = seekValue;
  lastTickTime = seekValue;
};

const volumeHandler = (value: SliderValue) => {
  musicStore.setVolume(toNumber(value) / 100);
};

const toggleMode = () => {
  const index = modeList.indexOf(mode.value);
  musicStore.setMode(modeList[(index + 1) % modeList.length]);
};

const clearPreload = () => {
  preloadedUrl = '';
  if (!preloadAudio) return;
  preloadAudio.removeAttribute('src');
  preloadAudio.load();
  preloadAudio = null;
};

/** 列表模式下提前加载下一首，配合 CDN 缓存让切歌更快 */
const preloadNextSong = () => {
  if (!isPlaying.value || mode.value !== 'list') {
    clearPreload();
    return;
  }
  const list = filteredPlaylist.value.length
    ? filteredPlaylist.value
    : playlist.value;
  if (list.length < 2) {
    clearPreload();
    return;
  }
  const index = currentSong.value
    ? list.findIndex((item) => item.id === currentSong.value?.id)
    : -1;
  if (index < 0) {
    clearPreload();
    return;
  }
  const nextSong = list[(index + 1) % list.length];
  if (nextSong.id === currentSong.value?.id || nextSong.url === preloadedUrl) {
    return;
  }
  clearPreload();
  preloadedUrl = nextSong.url;
  preloadAudio = new Audio();
  preloadAudio.preload = 'auto';
  preloadAudio.src = nextSong.url;
  preloadAudio.load();
};

watch(
  [() => currentSong.value?.id, isPlaying, mode, filteredPlaylist],
  preloadNextSong
);

const handleVisibilityChange = () => {
  if (document.visibilityState === 'hidden') {
    flushStat(currentSong.value?.id, true);
  }
};

const handlePageHide = () => {
  flushStat(currentSong.value?.id, true);
};

watch(
  () => currentSong.value?.id,
  async (id, oldId) => {
    flushStat(oldId || '');
    pendingSeconds = 0;
    lastTickTime = 0;
    playCounted = false;
    isSeeking.value = false;
    progressSeconds.value = 0;
    duration.value = currentSong.value?.duration || 0;

    const audio = audioRef.value;
    if (!audio) return;
    if (!id || !currentSong.value) {
      audio.removeAttribute('src');
      audio.load();
      return;
    }
    audio.src = currentSong.value.url;
    if (isPlaying.value) {
      await playAudio();
    }
  }
);

watch(isPlaying, async (playing) => {
  const audio = audioRef.value;
  if (!audio || !currentSong.value) return;
  if (playing) {
    if (!audio.getAttribute('src')) {
      audio.src = currentSong.value.url;
    }
    await playAudio();
  } else {
    audio.pause();
    flushStat();
  }
});

watch(
  volume,
  (value) => {
    if (audioRef.value) {
      audioRef.value.volume = value;
    }
  },
  { immediate: true }
);

onMounted(async () => {
  if (audioRef.value) {
    audioRef.value.volume = volume.value;
  }
  getLanguageList();
  getGenreList();
  await musicStore.loadPlaylist(true);
  // 歌单恢复后若已有上次歌曲，主动回填一次音频地址（watch 可能因 id 未变化而不触发）
  if (
    audioRef.value &&
    currentSong.value &&
    !audioRef.value.getAttribute('src')
  ) {
    audioRef.value.src = currentSong.value.url;
    duration.value = currentSong.value.duration || 0;
  }
  flushTimer = setInterval(() => {
    if (audioRef.value && !audioRef.value.paused) {
      flushStat();
    }
  }, 15000);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pagehide', handlePageHide);
});

onBeforeUnmount(() => {
  clearPreload();
  flushStat(currentSong.value?.id, true);
  musicStore.stop();
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  if (followTimer) {
    clearTimeout(followTimer);
    followTimer = null;
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  window.removeEventListener('pagehide', handlePageHide);
  const audio = audioRef.value;
  if (audio) {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }
});
</script>

<style scoped lang="scss">
.music-player {
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 2000;
  color: var(--sys-text-color);
}

.player-card {
  /* 固定宽度，切换歌词 / 播放列表时不改变卡片尺寸 */
  width: 400px;
  /* 歌词 / 播放列表面板共用的固定高度与间距，保证两者切换时卡片高度不变 */
  --music-panel-height: 360px;
  --music-panel-gap: 10px;
  padding: 14px 16px 12px;
  border: 1px solid var(--sys-border-color);
  border-radius: 14px;
  background: linear-gradient(145deg, var(--theme-bg), var(--sys-box-bg-color));
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.22);
}

@media (max-width: 640px) {
  .player-card {
    width: 340px;
  }
}

/* 深色模式保留原来的深色渐变，浅色模式改用浅底保证文字对比度 */
html.dark .player-card {
  background: linear-gradient(145deg,
      var(--theme-card-bg),
      var(--sys-box-bg-color));
}

.player-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cover {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--sys-border-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  animation: music-spin 12s linear infinite;
  animation-play-state: paused;

  &.is-playing {
    animation-play-state: running;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--theme-card-bg), var(--theme-color));
}

.song-info {
  flex: 1;
  min-width: 0;
}

.song-name {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-singer {
  margin-top: 3px;
  font-size: 12px;
  color: var(--sys-text-secondary-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 2px;

  /**
   * 顶部操作按钮做成纯图标：
   * 去掉圆形按钮和任何悬停 / 激活底色，只靠图标颜色表达状态，
   * 避免像独立工具栏一样从卡片里“浮”出来
   */
  .icon-btn {
    width: 24px;
    height: 24px;
    color: var(--sys-text-secondary-color);
    opacity: 0.7;
    transition:
      color 0.2s ease,
      opacity 0.2s ease;

    &:hover {
      color: var(--sys-text-color);
      background: transparent;
      opacity: 1;
    }

    &.is-active {
      color: var(--theme-color);
      background: transparent;
      opacity: 1;
    }
  }
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: var(--sys-text-secondary-color);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover,
  &.is-active {
    color: var(--theme-color);
    background: var(--sys-bg-color);
  }
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;

  .time {
    width: 38px;
    flex-shrink: 0;
    font-size: 11px;
    font-family: 'Courier New', monospace;
    color: var(--sys-text-secondary-color);
    text-align: center;
  }

  .progress-slider {
    flex: 1;
  }
}

.control-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2px;

  .mode-btn {
    margin-right: 2px;
  }

  .play-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg,
        var(--theme-card-bg),
        var(--theme-color));
    color: #fff;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.06);
    }

    &:active {
      transform: scale(0.94);
    }
  }
}

.volume-box {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 96px;
  color: var(--sys-text-secondary-color);

  .volume-slider {
    flex: 1;
  }
}

/**
 * 歌词 / 播放列表面板的槽位：
 * 两个面板共用同一个网格单元格并保持相同高度，交叉淡入淡出期间
 * 不会因同时存在于文档流中把卡片撑高，切换时也就没有高度跳变；
 * 外层高度随面板展开 / 收起做过渡，避免卡片整体跳变
 */
.panel-viewport {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  height: 0;
  overflow: hidden;
  transition: height 0.2s ease;

  &.is-open {
    height: calc(var(--music-panel-height) + var(--music-panel-gap));
  }

  >.lyric-panel,
  >.playlist-panel {
    grid-area: 1 / 1;
    box-sizing: border-box;
    height: var(--music-panel-height);
    margin-top: var(--music-panel-gap);
    padding-top: 8px;
    border-top: 1px dashed var(--sys-border-color);
  }
}

.lyric-panel {
  display: flex;
  flex-direction: column;
}

.lyric-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 4px 2px;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.lyric-line {
  flex-shrink: 0;
  padding: 7px 10px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--sys-text-secondary-color);
  text-align: center;
  white-space: pre-wrap;
  word-break: break-word;
  border-radius: 4px;
  transition:
    color 0.2s ease,
    transform 0.2s ease;

  &.is-clickable {
    cursor: pointer;

    &:hover {
      color: var(--theme-color);
      background: var(--sys-bg-color);
    }
  }

  &.is-active {
    font-weight: 600;
    color: var(--theme-color);
    transform: scale(1.04);
  }
}

.lyric-empty {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--sys-text-secondary-color);
  text-align: center;
}

.playlist-panel {
  display: flex;
  flex-direction: column;
}

.playlist-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 6px;
  color: var(--sys-text-secondary-color);

  >span {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}

.playlist-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
}

.playlist-search-input {
  flex: 1;
  min-width: 0;
  --el-input-height: 26px;

  :deep(.el-input__wrapper) {
    padding: 0 10px;
    background: transparent;
    border-radius: 999px;
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--sys-border-color) 55%, transparent) inset;
    transition: box-shadow 0.2s ease;

    &:hover {
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--theme-color) 40%, transparent) inset;
    }

    &.is-focus {
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--theme-color) 65%, transparent) inset;
    }
  }

  :deep(.el-input__inner) {
    font-size: 12px;
    color: var(--sys-text-color);

    &::placeholder {
      color: var(--sys-text-secondary-color);
    }
  }
}

.playlist-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
  color: var(--sys-text-secondary-color);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover,
  &:active,
  &.is-active {
    color: var(--theme-color);
    background: transparent;
  }
}

.filter-popover {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .filter-section-title {
    margin-bottom: 6px;
    font-size: 12px;
    color: var(--sys-text-secondary-color);
  }

  .filter-options {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .filter-option {
    padding: 3px 10px;
    font-size: 12px;
    line-height: 18px;
    color: var(--sys-text-color);
    background: var(--sys-bg-color);
    border: 1px solid var(--sys-border-color);
    border-radius: 999px;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      color: var(--theme-color);
      border-color: var(--theme-color);
    }

    &.is-active {
      color: #fff;
      background: var(--theme-color);
      border-color: var(--theme-color);
    }
  }
}

.playlist {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  margin-top: 4px;
  overflow: auto;
}

.playlist-item {
  display: grid;
  flex-shrink: 0;
  grid-template-columns: 36px minmax(0, 1fr) 40px;
  align-items: center;
  gap: 10px;
  padding: 8px 6px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: var(--sys-bg-color);
  }

  &.is-active {
    color: var(--sys-text-color);
    background: var(--theme-bg);
    box-shadow: inset 3px 0 0 var(--theme-color);

    .playlist-name {
      font-weight: 600;
    }
  }

  .playlist-cover {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
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

  .playlist-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .playlist-name,
  .playlist-singer {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .playlist-singer {
    font-size: 11px;
    color: var(--sys-text-secondary-color);
  }

  .playlist-count,
  .playlist-duration {
    color: var(--sys-text-secondary-color);
  }

  .playlist-duration {
    text-align: right;
  }
}

.playlist-empty {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 16px 0;
  font-size: 12px;
  color: var(--sys-text-secondary-color);
  text-align: center;
}

.collapsed-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--theme-card-bg), var(--theme-color));
  color: #fff;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.08);
  }

  &.is-playing::after {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 2px solid var(--theme-color);
    animation: music-pulse 1.8s ease-out infinite;
  }
}

:deep(.el-slider) {
  --el-slider-height: 4px;
  --el-slider-button-size: 10px;
}

.music-fade-enter-active,
.music-fade-leave-active {
  transition: all 0.25s ease;
}

.music-fade-enter-from,
.music-fade-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
}

.music-playlist-enter-active,
.music-playlist-leave-active {
  transition: all 0.2s ease;
}

/* 正在淡出的面板不再响应点击，避免切换瞬间误触旧视图 */
.music-playlist-leave-active {
  pointer-events: none;
}

.music-playlist-enter-from,
.music-playlist-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@keyframes music-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@keyframes music-pulse {
  0% {
    opacity: 0.8;
    transform: scale(0.96);
  }

  100% {
    opacity: 0;
    transform: scale(1.3);
  }
}
</style>
