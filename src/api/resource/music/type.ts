/** 管理列表排序方式：手动顺序 / 播放次数 / 累计收听时长 */
export type MusicSortByType = 'manual' | 'playCount' | 'listenSeconds';

export type MusicFormType = {
  name: string;
  singer: string;
  cover: string;
  url: string;
  /** 音频时长（秒） */
  duration: number;
  /** 语种，存字典 MUSIC_LANGUAGE 的 key */
  language: string;
  /** 风格，存字典 MUSIC_GENRE 的 key */
  genre: string;
  /** 歌词文本（LRC 或纯文本），可为空 */
  lyric: string;
};

export type MusicIdType = {
  id: string;
};

/** 根据已有音频地址解析内嵌信息的结果 */
export type MusicExtractType = {
  /** 本次实际补充的字段 */
  updated: ('name' | 'singer' | 'lyric' | 'cover')[];
  name: string;
  singer: string;
  lyric: string;
  cover: string;
};

export type MusicSearchType = {
  name: string;
  language: string;
  genre: string;
  sortBy: MusicSortByType;
};

export type MusicItemType = {
  playCount: number;
  listenSeconds: number;
  sort: number;
  createTime: string;
} & MusicFormType &
  MusicIdType;

export type MusicSortParamType = {
  ids: string[];
};

export type MusicStatType = {
  id: string;
  seconds: number;
};
