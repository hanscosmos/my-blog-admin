<template>
  <div>
    <el-popover
      trigger="hover"
      :width="200"
      :show-arrow="false"
      placement="bottom"
    >
      <template #reference>
        <el-avatar>
          <img v-if="userInfo.avatar" alt="avatar" :src="userInfo.avatar" />
          <span v-else>{{ userInfo.nickName.substring(0, 1) }}</span>
        </el-avatar>
      </template>

      <div class="w-full h-full">
        <div class="entrance-wrapper">
          <div
            class="entrance-item hover-weak-wrapper justify-between"
            @click="gotoRelatedPage('UserCenter')"
          >
            <div class="flex items-center">
              <MyIcon name="user" :size="18"></MyIcon>
              <span class="ml-4">个人中心</span>
            </div>
            <MyIcon name="right" :size="18"></MyIcon>
          </div>
          <el-divider class="!my-2"></el-divider>
          <div class="entrance-item hover-weak-wrapper" @click="logoutHandler">
            <MyIcon name="logout" :size="18"></MyIcon>
            <span class="ml-4">退出登录</span>
          </div>
        </div>
      </div>
    </el-popover>
  </div>
</template>
<script lang="ts" setup>
import { useMenuStore } from '@/store/menu';
import { useTabListStore } from '@/store/tab/tabList';
import { useUserInfoStore } from '@/store/user';
import { storeToRefs } from 'pinia';

const router = useRouter();
const { userInfo } = storeToRefs(useUserInfoStore());
const { menuTreeList } = storeToRefs(useMenuStore());
const { clearUserData } = useUserInfoStore();
const { clearTagList } = useTabListStore();

const logoutHandler = () => {
  confirmHandler('您的确要退出吗？', () => {
    clearUserData();
    clearTagList();
    menuTreeList.value = [];
    router.push({ name: 'Login' });
  });
};

const gotoRelatedPage = (name: string) => {
  router.push({ name });
};
</script>
<style lang="scss" scoped>
.entrance-item {
  @apply flex items-center px-4 py-3 rounded-lg;
}
</style>
