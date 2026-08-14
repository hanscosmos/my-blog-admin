<template>
  <div>
    <el-popover trigger="hover" :width="110" :show-arrow="false" placement="bottom">
      <template #reference>
        <el-avatar class="!w-9 !h-9">
          <img v-if="userInfo.avatar" alt="avatar" :src="userInfo.avatar" />
          <span v-else>{{ userInfo.nickName.substring(0, 1) }}</span>
        </el-avatar>
      </template>

      <div class="w-full h-full">
        <div class="entrance-wrapper">
          <div class="entrance-item xy-center hover-weak-wrapper mb-2 " @click="gotoRelatedPage('UserCenter')">
            <div class="flex items-center">
              <AppIcon name="people" :size="16" theme="filled"></AppIcon>
              <span class="ml-4">个人中心</span>
            </div>
          </div>
          <div class="entrance-item xy-center hover-weak-wrapper" @click="logoutHandler">
            <AppIcon name="logout" theme="filled" :size="16"></AppIcon>
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
  @apply flex items-center p-2 rounded-lg;
}
</style>
