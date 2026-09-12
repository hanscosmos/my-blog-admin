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

/**
 * 前端按关键词过滤菜单树
 * - 名称 / 路由名称 / 菜单码 任意一项包含关键词即视为命中
 * - 子节点命中时保留其父节点，命中节点保留完整子树
 */
export const filterMenuTree = (
  list: MenuItemType[],
  keyword: string
): MenuItemType[] => {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return list;
  return list.reduce<MenuItemType[]>((acc, item) => {
    const matched = [item.name, item.route, item.code].some((field) =>
      field?.toLowerCase().includes(kw)
    );
    if (matched) {
      acc.push(item);
      return acc;
    }
    const children = filterMenuTree(item.children || [], keyword);
    if (children.length) {
      acc.push({ ...item, children });
    }
    return acc;
  }, []);
};
