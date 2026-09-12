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
  /** 是否出现在左侧边栏；false 表示「全局」这类不在导航里的页面，仍参与角色授权 */
  isNav: boolean;
};

export type MenuItemType = MenuFormType & {
  id: string;
  children?: MenuItemType[];
};
