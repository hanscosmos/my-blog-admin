export type CategoryFormType = {
  name: string;
  value: string;
  sort: number;
};

export type CategoryIdType = {
  id: string;
};

export type CategoryItemType = CategoryFormType &
  CategoryIdType & {
    createTime: string;
  };
