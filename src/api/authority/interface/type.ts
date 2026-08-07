export type ApiFormType = {
  name: string;
  btnSign: string;
  path: string;
  sort: number | string;
  module?: string;
};

export type ApiIdType = {
  id: string;
};

export type ApiItemType = IdType & ApiFormType;
