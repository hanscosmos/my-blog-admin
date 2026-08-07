export type MenuFormType = {
  name: string;
  route: string;
  icon: string;
  color: string;
  code: string;
  type: string;
  sort: number;
  father: string | null;
  fatherName?: string | null;
};

export type MenuItemType = MenuFormType & {
  id: string;
  children?: MenuItemType[];
};
