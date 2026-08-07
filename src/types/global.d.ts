type PageType = { pageNumber: number; pageSize: number };

type TableColumnType = {
  props: string;
  label: string;
  width?: string;
  isRender?: boolean;
  sort?: boolean | 'custom';
};
type ResType<T> = {
  code: number;
  msg: string;
  data: T;
};

type StrictNameOrLabel =
  | { name: string; label?: undefined }
  | { name?: undefined; label: string };

type DictType = {
  value: string;
} & StrictNameOrLabel;

type IdType = {
  id: string;
};

type IdsType = {
  ids: string[];
};

type ResPageType<T> = {
  total: number;
  result: T[];
};

type ReqPageType<T extends object> = PageType & T;
