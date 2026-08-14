export interface IActivityArticle {
  id: string;
  title: string;
  cover: string | null;
  abstract: string | null;
  status: string;
  category: string | null;
  createTime: string;
  updateTime: string;
}

export interface IActivityItem {
  id: string;
  targetId: string | null;
  targetType: string;
  action: string;
  createTime: string;
  extraData: { title?: string };
  article: IActivityArticle | null;
}
