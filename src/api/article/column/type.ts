export type ArticleColumnFormType = {
  name: string;
  sort: number;
  cover: string;
  description: string;
};

export type ArticleColumnItemType = ArticleColumnFormType & {
  id: string;
  createTime: string | Date;
};

export type SearchArticleColumnType = {
  name?: string;
};
