export type DictFormType = {
  code: string;
  key: string;
  value: string;
  sort: number;
  desc: string;
};

export type DictItemType = IdType &
  DictFormType & {
    createTime: string | Date;
    updateTime: string | Date;
    status: boolean;
  };

export type DictSimpleItemType = IdType & {
  key: string;
  value: string;
};
