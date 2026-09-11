import { getSelfPermissionApi } from '@/api/authority/permission';
import type { MenuItemType } from '@/api/authority/menu/type';
import { useMenuStore } from '@/store/menu';
import { usePermissionStore } from '@/store/permission';
import { storeToRefs } from 'pinia';

/** 收集菜单树中所有节点声明的路由 name */
const collectMenuRoutes = (list: MenuItemType[], result: string[] = []) => {
  list.forEach((item) => {
    if (item.route) result.push(item.route);
    if (item.children?.length) collectMenuRoutes(item.children, result);
  });
  return result;
};

export const usePermission = () => {
  const permissionStore = usePermissionStore();
  const { isLoaded, isSuper, roles, permCodes, menuRoutes } =
    storeToRefs(permissionStore);

  /** 拉取当前用户的角色与权限码（登录时调用） */
  const loadPermission = async () => {
    const { data } = await getSelfPermissionApi();
    permissionStore.setPermission(data);
  };

  /** 确保权限数据已就绪，避免路由守卫在未加载时误判 */
  const ensurePermission = async () => {
    if (isLoaded.value) return;
    await loadPermission();
  };

  const clearPermission = () => permissionStore.clearPermission();

  /** 是否拥有指定操作权限码 */
  const hasPerm = (code: string | string[]) => permissionStore.hasPerm(code);

  /**
   * 是否可访问指定路由
   * 只有「在菜单树中声明过」的路由才做拦截，详情页等未声明路由放行，
   * 由页面内的按钮权限控制入口。
   */
  const canAccessRoute = (routeName?: string) => {
    if (!routeName) return true;
    if (isSuper.value) return true;
    // 非受控路由（详情页、个人中心等）不做拦截
    if (!menuRoutes.value.includes(routeName)) return true;
    return collectMenuRoutes(useMenuStore().menuTreeList).includes(routeName);
  };

  return {
    isLoaded,
    isSuper,
    roles,
    permCodes,
    menuRoutes,
    loadPermission,
    ensurePermission,
    clearPermission,
    hasPerm,
    canAccessRoute,
  };
};
