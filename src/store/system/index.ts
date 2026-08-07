import { defineStore } from 'pinia';
import type { SysModeType, SysThemeType } from './type';

export const useSystemStore = defineStore(
  'system',
  () => {
    const mode = ref<SysModeType>('dark');
    const theme = ref<SysThemeType>('green');
    const colorMap: any = {
      blue: '#1e88e5',
      purple: '#5e35b1',
      green: '#43a047',
      red: '#fb5050',
      pink: '#ec77d8',
    };
    const systemColor = computed(() => colorMap[theme.value]);

    const isDark = computed(() => mode.value === 'dark');
    const isSideExpand = ref<boolean>(true);
    const isOpenStore = ref<boolean>(false);

    const changeMode = async (newMode: 'light' | 'dark') => {
      document.documentElement.classList.remove(mode.value);
      document.documentElement.classList.add(newMode);
      mode.value = newMode;
    };

    const switchMode = () => {
      mode.value === 'light' ? changeMode('dark') : changeMode('light');
    };

    const changeTheme = (newTheme: SysThemeType) => {
      document.documentElement.classList.remove(theme.value);
      document.documentElement.classList.add(newTheme);
      theme.value = newTheme;
    };

    const initModeAndTheme = () => {
      document.documentElement.classList.add(theme.value);
      document.documentElement.classList.add(mode.value);
    };

    return {
      systemColor,
      mode,
      isDark,
      theme,
      isSideExpand,
      changeMode,
      switchMode,
      changeTheme,
      isOpenStore,
      initModeAndTheme,
    };
  },
  {
    persist: {
      key: 'system', // 修改存储的键名，默认为当前 Store 的 id
      storage: window.localStorage, // 存储位置修改为 sessionStorage
    },
  }
);
