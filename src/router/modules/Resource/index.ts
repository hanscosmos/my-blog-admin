import type { RouteRecordRaw } from 'vue-router';

export const ResourceRouteList: RouteRecordRaw[] = [
  {
    path: '/icon-manage',
    name: 'IconManage',
    component: () => import('@/views/pages/Resource/Icon/index.vue'),
    meta: {
      name: '图标管理',
      icon: 'platte',
    },
  },
  {
    path: '/image-manage',
    name: 'ImageManage',
    component: () => import('@/views/pages/Resource/Image/index.vue'),
    meta: {
      name: '图片管理',
      icon: 'pic-one',
    },
  },
  {
    path: '/music-manage',
    name: 'MusicManage',
    component: () => import('@/views/pages/Resource/Music/index.vue'),
    meta: {
      name: '音乐管理',
      icon: 'music',
    },
  },
];
