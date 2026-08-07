export type ArticleTagFormType = {
  name: string;
  alias: string;
  sort: number;
  color: string;
  description: string;
};

export type ArticleTagItemType = ArticleTagFormType & {
  id: string;
  createTime: string | Date;
};

export type SearchArticleTagType = {
  name?: string;
};
