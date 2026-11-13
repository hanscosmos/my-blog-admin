import type {
  MusicFormType,
  MusicItemType,
  MusicSearchType,
  MusicSortByType,
} from '@/api/resource/music/type';

/** 音频上传允许的格式 */
export const AUDIO_ACCEPT = '.mp3,.flac,.wav,.m4a,.aac,.ogg';

/** 歌词文件允许的格式 */
export const LYRIC_ACCEPT = '.lrc,.txt';

/** 歌词最大长度，需与后端 MAX_LYRIC_LENGTH 保持一致 */
export const MAX_LYRIC_LENGTH = 20000;

/** 歌词文件大小上限（KB） */
export const MAX_LYRIC_FILE_SIZE = 200;

export const originalForm: MusicFormType = {
  name: '',
  singer: '',
  cover: '',
  url: '',
  duration: 0,
  language: '',
  genre: '',
  lyric: '',
};

export const originalSearch: MusicSearchType = {
  name: '',
  language: '',
  genre: '',
  sortBy: 'manual',
};

export const sortOptions: { label: string; value: MusicSortByType }[] = [
  { label: '手动排序', value: 'manual' },
  { label: '按播放次数', value: 'playCount' },
  { label: '按累计时长', value: 'listenSeconds' },
];

export const formRules = {
  name: [{ required: true, trigger: 'change', message: '请输入歌曲名' }],
  url: [{ required: true, trigger: 'change', message: '请上传音频文件' }],
};

/** 编辑时只回填表单字段，统计字段不允许提交 */
export const getFormByRow = (row: MusicItemType): MusicFormType => ({
  name: row.name,
  singer: row.singer,
  cover: row.cover,
  url: row.url,
  duration: row.duration,
  language: row.language,
  genre: row.genre,
  lyric: row.lyric || '',
});
