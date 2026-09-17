import { NoticeItemType, NoticeQueryType } from './type';
import request from '@/utils/request';

export const getNoticeListApi = (data: NoticeQueryType & PageType) =>
  request.post<ResPageType<NoticeItemType>>('/notice/list', data);

/** 未读数：顶部角标轮询使用 */
export const getNoticeUnreadCountApi = () =>
  request.post<{ count: number }>('/notice/unread/count', {});

/** 标记指定消息已读 */
export const readNoticeApi = (data: IdsType) =>
  request.post<boolean>('/notice/read', data);

/** 全部已读 */
export const readAllNoticeApi = () =>
  request.post<boolean>('/notice/read/all', {});
