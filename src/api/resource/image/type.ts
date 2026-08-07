export type ImageFormType = {
  name: string;
  url: string;
  sort: number;
  desc: string;
  category: string;
};

export type ImageIdType = {
  id: string;
};

export type ImageSearchType = {
  name: string;
  category: string;
};

export type ImageItemType = {
  createTime: string;
} & ImageFormType &
  ImageIdType;
