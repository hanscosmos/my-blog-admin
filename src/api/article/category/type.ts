export type ArticleCategoryFormType = {
  name: string;
  alias: string;
  sort: number;
  father: string | null;
  fatherName?: string | null;
  description: string;
};

export type ArticleCategoryItemType = ArticleCategoryFormType & {
  id: string;
  createTime: string | Date;
  children?: ArticleCategoryItemType[];
};
