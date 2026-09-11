import { defineStore } from 'pinia';
import type {
  SelfPermissionType,
  SelfRoleType,
} from '@/api/authority/permission/type';

export const usePermissionStore = defineStore(
  'permission',
  () => {
    /** 是否已从后端拉取过权限数据 */
    const isLoaded = ref(false);
    const isSuper = ref(false);
    const roles = ref<SelfRoleType[]>([]);
    const permCodes = ref<string[]>([]);
    const menuRoutes = ref<string[]>([]);

    /**
     * 是否拥有指定操作权限
     * @param code 单个权限码或权限码数组（数组表示满足其中之一即可）
     */
    const hasPerm = (code: string | string[]) => {
      if (isSuper.value) return true;
      const codes = Array.isArray(code) ? code : [code];
      return codes.some((item) => permCodes.value.includes(item));
    };

    const setPermission = (data: SelfPermissionType) => {
      isSuper.value = data.isSuper;
      roles.value = data.roles || [];
      permCodes.value = data.codes || [];
      menuRoutes.value = data.menuRoutes || [];
      isLoaded.value = true;
    };

    const clearPermission = () => {
      isLoaded.value = false;
      isSuper.value = false;
      roles.value = [];
      permCodes.value = [];
      menuRoutes.value = [];
    };

    return {
      isLoaded,
      isSuper,
      roles,
      permCodes,
      menuRoutes,
      hasPerm,
      setPermission,
      clearPermission,
    };
  },
  {
    persist: {
      key: 'permission',
      storage: window.localStorage,
    },
  }
);
