import type { MenuItemType } from '@/api/authority/menu/type';

export type DrawerPropsType = {
  fatherMenuItem: {
    name: string;
    id: string | null;
    type: string;
    /** 新建子节点时继承父节点的侧边栏可见性 */
    isNav: boolean;
  };
  currentMenuItem: MenuItemType | null;
  optType: 'add' | 'edit';
};

/** 菜单层级固定为三级，由父节点推导，不依赖字典数据 */
export const MENU_TYPE_OPTIONS = [
  { key: '1', value: '目录' },
  { key: '2', value: '页面' },
  { key: '3', value: '操作权限' },
];

export const getMenuTypeLabel = (type: string) =>
  MENU_TYPE_OPTIONS.find((item) => item.key === type)?.value || '—';
