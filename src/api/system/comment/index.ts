import { CommentItemType, CommentQueryType } from './type';
import request from '@/utils/request';

export const getCommentListApi = (data: CommentQueryType & PageType) =>
  request.post<ResPageType<CommentItemType>>('/comment/list', data);

/** 删除评论：顶层评论会连带其下回复一起软删，返回实际删除条数 */
export const deleteCommentApi = (data: IdsType) =>
  request.post<number>('/comment/delete', data);

/** 禁用 / 解禁评论人 */
export const forbidCommentUserApi = (data: {
  userId: string;
  isForbidden: boolean;
}) => request.post<boolean>('/comment/forbid-user', data);
