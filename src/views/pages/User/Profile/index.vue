<template>
  <div class="wh-full flex flex-col max-w-1200px mx-auto py-4">
    <div
      v-if="baseUserInfo"
      class="header-wrapper h-200px px-12 wrapper-item mb-4 flex items-center"
    >
      <div class="image-wrapper w-32 h-32 rounded-full mr-6">
        <img
          v-if="baseUserInfo.avatar"
          class="w-full h-full object-cover rounded-full"
          :src="baseUserInfo.avatar"
          alt=""
        />
      </div>
      <div class="flex-1 w-0 info-wrapper h-32 relative">
        <div class="text-xl font-bold font-pingfang my-2 flex items-center">
          {{ baseUserInfo.nickName }}
          <span class="text-sm text-gray-500 ml-2">{{
            baseUserInfo.email
          }}</span>
        </div>
        <div class="flex items-center">
          <my-icon
            :name="baseUserInfo.sex ? 'male' : 'female'"
            :color="baseUserInfo.sex ? '#136ddc' : '#df96ed'"
            size="16"
            class="relative top-2px"
          ></my-icon>
          <span class="text-sm ml-2">
            加入于<span class="text-gray-500">
              {{ dateDiff(baseUserInfo.createTime) }}前</span
            >
          </span>
        </div>

        <div class="text-sm text-gray-500 mt-3">{{ baseUserInfo.talks }}</div>
        <my-button
          class="absolute right-0 top-0"
          type="text"
          @click="openDrawerHandler"
        >
          <my-icon name="edit" class="mr-2" size="16"></my-icon>
          编辑个人资料</my-button
        >
      </div>
    </div>
    <div
      class="main-wrapper w-full flex-1 h-0 overflow-auto wrapper-item flex flex-col"
    >
      <div class="tab-wrapper w-full flex mb-4 h-12 px-4 border-bottom">
        <span
          v-for="item in tabList"
          :key="item.key"
          class="tag-item transition-all xy-center hover-text px-2 mr-4"
          :class="{ 'line-active-item': activeItem?.key === item.key }"
          @click="setActiveTabItem(item)"
        >
          {{ item.name }}
        </span>
      </div>
      <div v-if="activeItem" class="flex-1 h-0 overflow-auto">
        <component :is="activeItem.component"></component>
      </div>
    </div>
  </div>
  <UserProfileForm
    ref="drawerRef"
    :default-data="baseUserInfo"
    @send-data="updateUserProfileHandler"
  ></UserProfileForm>
</template>
<script lang="ts" setup>
import { getUserProfileApi, updateUserProfileApi } from '@/api/user';
import { UserInfoType, UserFormType } from '@/api/user/type';
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
    name: '我的创作',
    key: 'article',
    component: shallowRef(UserArticle),
  },
  {
    name: '个人事项',
    key: 'task',
    component: shallowRef(UserTask),
  },
];
const activeItem = ref<TabItem>(tabList[0]);

const setActiveTabItem = (item: TabItem) => {
  activeItem.value = item;
};

onMounted(() => {
  getUserInfoHandler();
  setActiveTabItem(tabList[0]);
});
</script>
<style lang="scss" scoped></style>
