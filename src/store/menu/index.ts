import { defineStore } from 'pinia';
import type { MenuItemType } from '@/api/authority/menu/type';

export const useMenuStore = defineStore(
  'menu',
  () => {
    const menuTreeList = ref<MenuItemType[]>([]);

    return {
      menuTreeList,
    };
  },
  {
    persist: {
      key: 'menu', // 修改存储的键名，默认为当前 Store 的 id
      storage: window.localStorage, // 存储位置修改为 sessionStorage
    },
  }
);
