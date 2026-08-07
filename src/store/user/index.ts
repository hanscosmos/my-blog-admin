import { defineStore } from 'pinia';
import type { UserInfoType } from './type';

export const useUserInfoStore = defineStore(
  'user',
  () => {
    const baseInfo: UserInfoType = {
      id: '',
      nickName: '',
      avatar: '',
      bgCover: null,
      sex: '',
      loginTime: '',
      createTime: '',
    };

    const userInfo = ref<UserInfoType>({
      ...baseInfo,
    });

    const userId = computed(() => userInfo.value.id || '');
    const token = ref<string>('');
    const csrfToken = ref<string>('');
    const isLogin = ref<boolean>(false);

    const clearUserData = () => {
      userInfo.value = { ...baseInfo };
      token.value = '';
      csrfToken.value = '';
      isLogin.value = false;
    };

    return {
      userId,
      userInfo,
      token,
      csrfToken,
      isLogin,
      clearUserData,
    };
  },
  {
    persist: {
      key: 'user', // 修改存储的键名，默认为当前 Store 的 id
      storage: window.localStorage, // 存储位置修改为 sessionStorage
    },
  }
);
