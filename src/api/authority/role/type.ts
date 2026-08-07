export type RoleFormType = {
  name: string;
  code: string;
  sort: number;
  limit: number;
};

export type RoleItemType = IdType & RoleFormType;
