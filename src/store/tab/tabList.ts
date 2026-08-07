import type { TabItem } from '@/types/type';
import { defineStore } from 'pinia';

export const useTabListStore = defineStore(
  'tabList',
  () => {
    const router = useRouter();
    const visible = ref(true);
    const tabList = ref<TabItem[]>([]);

    const currentTab = ref<TabItem>(tabList.value[0]);
    const currentTabIndex = computed(() =>
      tabList.value.findIndex((el) => el.id === currentTab.value.id)
    );

    const toggleVisible = (isShow: boolean) => {
      visible.value = isShow;
    };
    const selectTabItem = (item: TabItem) => {
      currentTab.value = item;
      if (item.query) {
        router.push({ name: item.routeName, query: item.query });
      } else {
        router.push({ name: item.routeName });
      }
    };
    const addTabItem = (item: TabItem) => {
      const pathList = tabList.value.map((el: TabItem) => el.routeName);
      if (!pathList.includes(item.routeName)) {
        tabList.value.push(item);
        currentTab.value = item;
      } else {
        currentTab.value = item;
        if (item.query) {
          const ind = tabList.value.findIndex(
            (el) => el.routeName === item.routeName
          );
          tabList.value[ind] = item;
        }
      }
    };

    const closeTag = (item: TabItem) => {
      const ind = tabList.value.findIndex((el: TabItem) => el.id === item.id);
      if (ind === currentTabIndex.value) {
        if (ind === tabList.value.length - 1) {
          selectTabItem(tabList.value[ind - 1]);
        } else {
          selectTabItem(tabList.value[ind + 1]);
        }
        tabList.value = tabList.value.filter(
          (el: TabItem) => el.routeName !== item.routeName
        );
      } else {
        if (ind > currentTabIndex.value) {
          tabList.value = tabList.value.filter(
            (el: TabItem) => el.routeName !== item.routeName
          );
        } else {
          tabList.value = tabList.value.filter(
            (el: TabItem) => el.routeName !== item.routeName
          );
          selectTabItem(tabList.value[ind]);
        }
      }
    };

    const closeOtherTag = (item: TabItem) => {
      tabList.value = tabList.value.filter((el) => {
        return el.id === 'Home' || el.id === item.id;
      });
      selectTabItem(item);
    };

    const closeAfterTag = (item: TabItem) => {
      const pathList = tabList.value.map((el: TabItem) => el.routeName);
      const ind = pathList.findIndex((el: string) => el === item.routeName);
      tabList.value = tabList.value.slice(0, ind + 1);
      router.push({ name: item.routeName });
    };

    const closeBeforeTag = (item: TabItem) => {
      const pathList = tabList.value.map((el: TabItem) => el.routeName);
      const index = pathList.findIndex((el: string) => el === item.routeName);
      tabList.value = [tabList.value[0], ...tabList.value.slice(index)];
      currentTab.value = item;
      router.push({ name: item.routeName });
    };

    const clearTagList = () => {
      tabList.value = tabList.value.filter((el) => el.id === 'Home');
      currentTab.value = tabList.value[0];
    };

    return {
      visible,
      toggleVisible,
      tabList,
      currentTab,
      addTabItem,
      currentTabIndex,
      closeTag,
      closeOtherTag,
      closeBeforeTag,
      closeAfterTag,
      selectTabItem,
      clearTagList,
    };
  },
  {
    persist: {
      key: 'tabList', // 修改存储的键名，默认为当前 Store 的 id
      storage: window.sessionStorage, // 存储位置修改为 sessionStorage
    },
  }
);
