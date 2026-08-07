import type { RouteRecordRaw } from 'vue-router';

export const UserRouteList: RouteRecordRaw[] = [
  {
    path: '/user-profile',
    name: 'UserCenter',
    component: () => import('@/views/pages/User/Profile/index.vue'),
    meta: {
      name: '个人中心',
      icon: 'user',
    },
  },
];
