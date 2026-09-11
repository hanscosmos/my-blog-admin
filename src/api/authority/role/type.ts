export type RoleFormType = {
  name: string;
  code: string;
  sort: number;
  limit: number;
};

export type RoleItemType = IdType &
  RoleFormType & {
    /** 内置超级管理员角色，不可修改/删除，默认拥有全部权限 */
    isSuper: boolean;
  };
