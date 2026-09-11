import type { RouteRecordRaw } from 'vue-router';

export const AuthRouteList: RouteRecordRaw[] = [
  {
    path: '/menu-manage',
    name: 'MenuManage',
    component: () => import('@/views/pages/Auth/Menu/index.vue'),
    meta: {
      name: '菜单管理',
      icon: 'system',
    },
  },
  {
    path: '/role-manage',
    name: 'RoleManage',
    component: () => import('@/views/pages/Auth/Role/index.vue'),
    meta: {
      name: '角色管理',
      icon: 'address-book',
    },
  },
];
