<template>
  <div class="wh-full flex max-w-1200px mx-auto py-4">
    <!-- Left: User Info Card -->
    <div v-if="baseUserInfo" class="user-card w-64 flex-shrink-0 mr-4 p-6 wrapper-item flex flex-col items-center">
      <div class="image-wrapper w-20 h-20 rounded-full mb-4 flex-shrink-0">
        <img v-if="baseUserInfo.avatar" class="w-full h-full object-cover rounded-full" :src="baseUserInfo.avatar"
          alt="" />
      </div>
      <div class="text-lg font-bold font-pingfang mb-1 text-center w-full truncate">{{ baseUserInfo.nickName }}</div>
      <div class="text-xs text-gray-500 mb-3 text-center w-full truncate">{{ baseUserInfo.email }}</div>
      <div class="flex items-center mb-2 text-xs text-gray-500">
        <AppIcon :name="baseUserInfo.sex ? 'male' : 'female'" :color="baseUserInfo.sex ? '#136ddc' : '#df96ed'"
          size="14" class="mr-1" />
        <span>加入于{{ dateDiff(baseUserInfo.createTime) }}前</span>
      </div>
      <div class="text-xs text-gray-500 mb-4 text-center leading-relaxed px-2">
        {{ baseUserInfo.talks || '这个人很懒，什么都没写~' }}
      </div>

      <!-- Stats -->
      <div class="w-full flex justify-around mb-4 py-3"
        style="border-top: 1px solid var(--sys-border-color); border-bottom: 1px solid var(--sys-border-color);">
        <div class="flex flex-col items-center cursor-pointer" @click="setActiveTabItem(tabList[1])">
          <span class="text-lg font-bold">{{ tabCounts.article }}</span>
          <span class="text-xs text-gray-500">文章</span>
        </div>
        <div class="flex flex-col items-center cursor-pointer" @click="setActiveTabItem(tabList[0])">
          <span class="text-lg font-bold">{{ tabCounts.dynamic }}</span>
          <span class="text-xs text-gray-500">动态</span>
        </div>
        <div class="flex flex-col items-center cursor-pointer" @click="setActiveTabItem(tabList[2])">
          <span class="text-lg font-bold">{{ tabCounts.task }}</span>
          <span class="text-xs text-gray-500">事项</span>
        </div>
      </div>

      <app-button class="w-full" type="text" @click="openDrawerHandler">
        <AppIcon name="edit" class="mr-1" size="14"></AppIcon>
        编辑个人资料
      </app-button>
    </div>

    <!-- Right: Tab + Content -->
    <div class="flex-1 w-0 flex flex-col wrapper-item">
      <div class="tab-wrapper w-full flex flex-shrink-0 h-12 px-4 border-bottom">
        <span v-for="item in tabList" :key="item.key" class="tag-item transition-all xy-center hover-text mr-6 "
          :class="{ 'line-active-item': activeItem?.key === item.key }" @click="setActiveTabItem(item)">
          {{ item.name }}<span v-if="tabCounts[item.key] > 0" class="text-gray-500 ml-2 text-sm">{{ tabCounts[item.key]
            }}</span>
        </span>
      </div>
      <div v-if="activeItem" class="flex-1 h-0 overflow-auto">
        <component :is="activeItem.component"></component>
      </div>
    </div>
  </div>
  <UserProfileForm ref="drawerRef" :default-data="baseUserInfo" @send-data="updateUserProfileHandler"></UserProfileForm>
</template>
<script lang="ts" setup>
import { getUserProfileApi, updateUserProfileApi, getUserStatsApi } from '@/api/user';
import { UserInfoType, UserFormType } from '@/api/user/type';
import { useUserInfoStore } from '@/store/user';
import UserProfileForm from './components/UserProFileForm.vue';
import UserActivity from '../Activity/index.vue';
import UserArticle from '../Article/index.vue';
import UserTask from '../Task/index.vue';
import type { Component } from 'vue';

interface TabItem {
  name: string;
  key: string;
  component: Component;
}
const baseUserInfo = ref<UserInfoType | null>(null);

const drawerRef = ref();

const openDrawerHandler = async () => {
  drawerRef.value.openDrawer();
};

const getUserInfoHandler = async () => {
  const { data } = await getUserProfileApi();
  baseUserInfo.value = { ...data };
  // 同步更新 Pinia store，确保导航栏头像等全局状态同步刷新
  const userStore = useUserInfoStore();
  if (data.id) userStore.userInfo.id = data.id;
  userStore.userInfo.avatar = data.avatar;
  userStore.userInfo.nickName = data.nickName;
  userStore.userInfo.bgCover = data.bgCover;
};

const updateUserProfileHandler = async (form: UserFormType) => {
  const res = await updateUserProfileApi(form);
  if (res.code === 0) {
    ElMessage.success('更新成功');
    getUserInfoHandler();
  }
};

const tabList: TabItem[] = [
  {
    name: '动态',
    key: 'dynamic',
    component: shallowRef(UserActivity),
  },
  {
    name: '创作',
    key: 'article',
    component: shallowRef(UserArticle),
  },
  {
    name: '事项',
    key: 'task',
    component: shallowRef(UserTask),
  },
];
const activeItem = ref<TabItem>(tabList[0]);

// 各 tab 的数据总数，由子组件通过 inject 上报
const tabCounts = reactive<Record<string, number>>({
  article: 0,
  dynamic: 0,
  task: 0,
});

provide('updateTabCount', (key: string, count: number) => {
  tabCounts[key] = count;
});

const getUserStatsHandler = async () => {
  try {
    const { data } = await getUserStatsApi();
    tabCounts.article = data.articleCount;
    tabCounts.dynamic = data.activityCount;
    tabCounts.task = data.taskCount;
  } catch {
    // 统计接口非关键路径，静默失败
  }
};

const setActiveTabItem = (item: TabItem) => {
  activeItem.value = item;
};

onMounted(() => {
  getUserInfoHandler();
  getUserStatsHandler();
  setActiveTabItem(tabList[0]);
});
</script>
<style lang="scss" scoped></style>
