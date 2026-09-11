export type SelfRoleType = {
  id: string;
  name: string;
  code: string;
};

export type SelfPermissionType = {
  /** 是否为超级管理员（拥有全部权限） */
  isSuper: boolean;
  roles: SelfRoleType[];
  /** 操作权限码集合，对应菜单树中按钮节点的 code */
  codes: string[];
  /** 全量受控路由（菜单中声明的页面路由 name） */
  menuRoutes: string[];
};
