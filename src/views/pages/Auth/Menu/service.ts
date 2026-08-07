import type { MenuItemType } from '@/api/authority/menu/type';

export type DrawerPropsType = {
  fatherMenuItem: {
    name: string;
    id: string | null;
    type: string;
  };
  currentMenuItem: MenuItemType | null;
  optType: 'add' | 'edit';
};
