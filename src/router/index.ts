import { RouteRecordRaw, createRouter, createWebHistory } from 'vue-router';
import { routeList } from './modules';
import { getSessionStorage } from '@/utils/storage';
import { useUserInfoStore } from '@/store/user';
import { storeToRefs } from 'pinia';
import { ElMessage } from 'element-plus';
import { useTabListStore } from '@/store/tab/tabList';
import type { TabItem } from '@/types/type';

const routes: RouteRecordRaw[] = [
  {
    path: '/layout',
    name: 'Layout',
    component: () => import('@/layout/index.vue'),
    children: routeList,
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/pages/Global/Login/index.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
  const { isLogin } = storeToRefs(useUserInfoStore());
  const { addTabItem } = useTabListStore();
  if (isLogin.value) {
    if (to.name === 'Login') {
      ElMessage.warning('您已经登录');
      next(from.path);
    } else {
      if (!to.meta?.isHideTabBar) {
        const baseItem = {
          id: to.name as string,
          routeName: to.name as string,
          name: (to.meta.name as string) || '',
          icon: to.meta.icon as string,
        };
        const menuItem = to.query
          ? {
              ...baseItem,
              query: to.query,
            }
          : baseItem;
        document.title = menuItem.name || '博客后台管理系统';
        addTabItem(menuItem as TabItem);
      } else {
        document.title = (to.meta.name as string) || '博客后台管理系统';
      }
      next();
    }
  } else {
    if (to.name === 'Login') {
      next();
      if (getSessionStorage('tokenValid')) {
        ElMessage.error('token过期或无效，请重新登录');
        sessionStorage.removeItem('tokenValid');
      }
    } else {
      ElMessage.error('您尚未登录');
      next({ name: 'Login' });
    }
  }
});

export default router;
