export type ArticleFormType = {
  title: string;
  pinyin: string;
  category: string;
  content: string;
  properties: string;
  visible: string;
  column?: string;
  cover?: string;
  abstract: string;
};

export type ArticleIdType = {
  id: string;
};

export type ArticleItemType = ArticleFormType & {
  id: string;
  createTime: string;
  updateTime: string;
};

export type ArticleListItemType = {
  id: string;
  title: string;
  abstract: string;
  cover: string;
  author: string;
  authorId: string;
  authorAvatar: string | null;
  category: string;
  status: string;
  createTime: string;
  updateTime: string;
};

export type ArticleQueryType = {
  title: string;
  category?: string;
  tags?: string[];
  visible?: string;
  column?: string;
  isTop?: boolean;
};
