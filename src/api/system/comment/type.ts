/** 评论对象类型：article 文章评论；message 留言板 */
export type CommentTargetType = 'article' | 'message';

/** 评论人 / 被回复人的展示信息 */
export type CommentUserType = {
  id: string;
  nickName: string;
  avatar: string | null;
  /** 是否已被禁用，据此在「禁用 / 解禁」之间切换 */
  isForbidden: boolean;
};

/** 评论项：顶层与回复同构，顶层多一个 replies */
export type CommentItemType = {
  id: string;
  content: string;
  targetType: CommentTargetType;
  targetId: string | null;
  /** 评论对象展示名：文章标题 / 留言板；文章已删除时为占位文案 */
  targetName: string;
  /** 所属顶层评论 id；为空表示这是顶层评论 */
  rootId: string | null;
  user: CommentUserType;
  /** 被回复者，渲染「A 回复 B」 */
  replyUser: CommentUserType | null;
  ip: string | null;
  status: string;
  createTime: string;
  /** 仅顶层评论：其下的回复 */
  replies?: CommentItemType[];
};

export type CommentQueryType = {
  keyword: string;
  targetType: string;
  startTime: string;
  endTime: string;
  /** 按评论 id 精确定位（从消息提醒跳转时使用），命中回复时返回到它所属的顶层评论 */
  focusId?: string;
};
