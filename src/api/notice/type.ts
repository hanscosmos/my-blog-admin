/** 消息类型：article_comment 内容被评论；comment_reply 评论被回复 */
export type NoticeTypeValue = 'article_comment' | 'comment_reply';

/** 评论对象类型，与评论模块同口径 */
export type NoticeTargetType = 'article' | 'message';

/** 触发人（评论人）展示信息 */
export type NoticeSenderType = {
  id: string;
  nickName: string;
  avatar: string | null;
};

export type NoticeItemType = {
  id: string;
  type: NoticeTypeValue;
  isRead: boolean;
  createTime: string;
  sender: NoticeSenderType;
  /** 触发评论的摘要（后端已截断） */
  content: string;
  /** 触发评论已删除 / 被隐藏，此时不提供跳转 */
  isDeleted: boolean;
  /** 被回复评论的摘要，仅 type=comment_reply 有值 */
  rootContent: string;
  targetType: NoticeTargetType;
  targetId: string | null;
  /** 评论对象展示名：文章标题 / 留言板；文章已删时为占位文案 */
  targetName: string;
  /** 触发评论 id，用于跳转评论管理时定位 */
  sourceId: string;
};

export type NoticeQueryType = {
  /** 不传 = 全部；传 false = 只看未读 */
  isRead?: boolean;
};
