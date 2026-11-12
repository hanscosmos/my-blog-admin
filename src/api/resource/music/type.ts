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
};

export type MusicIdType = {
  id: string;
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
