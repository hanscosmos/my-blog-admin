import type { RouteRecordRaw } from 'vue-router';

export const WorkBenchRouteList: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/pages/WorkBench/Home/index.vue'),
    meta: {
      name: '首页',
      icon: 'home',
    },
  },
];
