import request from '@/utils/request';
import { storeToRefs } from 'pinia';
import { useUserInfoStore } from '@/store/user';
import type {
  MusicFormType,
  MusicIdType,
  MusicItemType,
  MusicSearchType,
  MusicSortParamType,
  MusicStatType,
} from './type';

export const getMusicListApi = (data: PageType & MusicSearchType) =>
  request.post<ResPageType<MusicItemType>>('/resource/music/list', data);

export const getAllMusicApi = () =>
  request.post<MusicItemType[]>('/resource/music/all', {});

export const addMusicApi = (data: MusicFormType) =>
  request.post<boolean>('/resource/music/add', data);

export const editMusicApi = (data: MusicFormType & MusicIdType) =>
  request.post<boolean>('/resource/music/edit', data);

export const deleteMusicApi = (data: IdsType) =>
  request.post<boolean>('/resource/music/delete', data);

export const sortMusicApi = (data: MusicSortParamType) =>
  request.post<boolean>('/resource/music/sort', data);

export const playMusicApi = (data: MusicIdType) =>
  request.post<boolean>('/resource/music/play', data);

export const addMusicListenSecondsApi = (data: MusicStatType) =>
  request.post<boolean>('/resource/music/stat', data);

/**
 * 页面关闭/隐藏时用 keepalive 兜底上报收听时长。
 * 普通 axios 请求在 unload 阶段可能被浏览器取消，这里用 fetch keepalive。
 */
export const flushMusicListenSecondsKeepalive = (
  id: string,
  seconds: number
) => {
  if (!id || seconds <= 0) return;
  const { token } = storeToRefs(useUserInfoStore());
  if (!token.value) return;
  fetch('/backapi/resource/music/stat', {
    method: 'POST',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token.value,
    },
    body: JSON.stringify({ id, seconds }),
  }).catch(() => {
    // 页面正在关闭，失败无需提示
  });
};

export default {
  getMusicListApi,
  getAllMusicApi,
  addMusicApi,
  editMusicApi,
  deleteMusicApi,
  sortMusicApi,
  playMusicApi,
  addMusicListenSecondsApi,
  flushMusicListenSecondsKeepalive,
};
