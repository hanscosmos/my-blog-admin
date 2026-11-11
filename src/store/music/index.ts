import { defineStore } from 'pinia';
import { getAllMusicApi } from '@/api/resource/music';
import type { MusicItemType } from '@/api/resource/music/type';

export type MusicPlayModeType = 'list' | 'single' | 'shuffle';

export const useMusicStore = defineStore(
  'music',
  () => {
    /** 播放器歌单，始终按手动 sort 顺序 */
    const playlist = ref<MusicItemType[]>([]);
    const currentSong = ref<MusicItemType | null>(null);
    const isPlaying = ref(false);
    const loading = ref(false);

    const volume = ref(0.7);
    const mode = ref<MusicPlayModeType>('list');
    const collapsed = ref(true);
    /** 上次播放的歌曲，重启后台后恢复但保持暂停 */
    const lastSongId = ref('');

    const currentIndex = computed(() => {
      if (!currentSong.value) return -1;
      return playlist.value.findIndex(
        (item) => item.id === currentSong.value?.id
      );
    });

    const findSong = (id: string) =>
      playlist.value.find((item) => item.id === id);

    /** 拉取全量歌单；force 用于新增/编辑/删除/排序后刷新 */
    const loadPlaylist = async (force = false) => {
      if (loading.value) return;
      if (playlist.value.length && !force) return;
      loading.value = true;
      try {
        const { data } = await getAllMusicApi();
        playlist.value = data || [];
        if (currentSong.value) {
          currentSong.value = findSong(currentSong.value.id) || null;
          if (!currentSong.value) {
            isPlaying.value = false;
          }
        }
        if (!currentSong.value && lastSongId.value) {
          currentSong.value = findSong(lastSongId.value) || null;
        }
      } finally {
        loading.value = false;
      }
    };

    const playSong = async (songOrId: MusicItemType | string) => {
      if (!playlist.value.length) {
        await loadPlaylist();
      }
      const song =
        typeof songOrId === 'string'
          ? findSong(songOrId)
          : findSong(songOrId.id) || songOrId;
      if (!song) return;
      if (currentSong.value?.id !== song.id) {
        currentSong.value = song;
        lastSongId.value = song.id;
      }
      isPlaying.value = true;
      collapsed.value = false;
    };

    const toggle = async () => {
      if (!playlist.value.length) {
        await loadPlaylist();
      }
      if (!currentSong.value) {
        const first = playlist.value[0];
        if (first) await playSong(first);
        return;
      }
      isPlaying.value = !isPlaying.value;
    };

    const next = async () => {
      if (!playlist.value.length) {
        await loadPlaylist();
      }
      const total = playlist.value.length;
      if (!total) return;
      const index = currentIndex.value;
      let nextIndex = 0;
      if (mode.value === 'shuffle' && total > 1) {
        nextIndex = index;
        while (nextIndex === index) {
          nextIndex = Math.floor(Math.random() * total);
        }
      } else {
        nextIndex = index < 0 ? 0 : (index + 1) % total;
      }
      currentSong.value = playlist.value[nextIndex];
      lastSongId.value = currentSong.value.id;
      isPlaying.value = true;
    };

    const prev = async () => {
      if (!playlist.value.length) {
        await loadPlaylist();
      }
      const total = playlist.value.length;
      if (!total) return;
      const index = currentIndex.value;
      let prevIndex = total - 1;
      if (mode.value === 'shuffle' && total > 1) {
        prevIndex = index;
        while (prevIndex === index) {
          prevIndex = Math.floor(Math.random() * total);
        }
      } else {
        prevIndex = index <= 0 ? total - 1 : index - 1;
      }
      currentSong.value = playlist.value[prevIndex];
      lastSongId.value = currentSong.value.id;
      isPlaying.value = true;
    };

    const setVolume = (value: number) => {
      volume.value = Math.min(1, Math.max(0, value));
    };

    const setMode = (value: MusicPlayModeType) => {
      mode.value = value;
    };

    const stop = () => {
      isPlaying.value = false;
    };

    return {
      playlist,
      currentSong,
      isPlaying,
      loading,
      volume,
      mode,
      collapsed,
      lastSongId,
      currentIndex,
      loadPlaylist,
      playSong,
      toggle,
      next,
      prev,
      setVolume,
      setMode,
      stop,
    };
  },
  {
    persist: {
      key: 'music',
      storage: window.localStorage,
      paths: ['volume', 'mode', 'collapsed', 'lastSongId'],
    },
  }
);
