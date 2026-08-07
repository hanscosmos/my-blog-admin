export type IconFormType = {
  name: string;
  url: string;
  sort: number;
  desc: string;
  source: string;
  category: string;
};

export type IconIdType = {
  id: string;
};

export type IconSearchType = {
  name: string;
  category: string;
};

export type IconItemType = {
  createTime: string;
} & IconFormType &
  IconIdType;
