<template>
  <div class="profile-page wh-full max-w-1200px mx-auto py-3 flex flex-col gap-2.5">
    <!-- 顶部封面页头 -->
    <div v-if="baseUserInfo" class="profile-cover relative flex-shrink-0 overflow-hidden">
      <img v-if="baseUserInfo.bgCover" :src="baseUserInfo.bgCover" alt="" class="cover-bg w-full h-full object-cover" />
      <div v-else class="cover-bg cover-fallback w-full h-full"></div>
      <div class="cover-mask absolute inset-0"></div>

      <!-- 编辑资料 -->
      <div class="absolute top-3 right-3 z-10">
        <span v-perm="'user:profile:update'" class="cover-edit-btn cursor-pointer" @click="openDrawerHandler">
          <AppIcon name="edit" size="14" />
          <span class="ml-1">编辑个人资料</span>
        </span>
      </div>

      <!-- 身份信息 -->
      <div class="absolute left-5 right-5 bottom-4 z-10 flex items-center">
        <div class="avatar-frame flex-shrink-0 rounded-full overflow-hidden ring-2 ring-white/80">
          <img v-if="baseUserInfo.avatar" :src="baseUserInfo.avatar" alt="" class="w-16 h-16 object-cover" />
          <span v-else
            class="avatar-initials w-16 h-16 flex items-center justify-center text-xl font-bold text-white">{{
              avatarInitial }}</span>
        </div>
        <div class="ml-3 min-w-0 text-white">
          <div class="text-xl font-bold truncate leading-6">{{ baseUserInfo.nickName }}</div>
          <div class="flex items-center text-xs opacity-80 mt-1 leading-5">
            <AppIcon v-if="baseUserInfo.sex === 1" name="male" :color="'#bfdbfe'" size="12"
              class="mr-1 flex-shrink-0" />
            <AppIcon v-else-if="baseUserInfo.sex === 0" name="female" :color="'#fbcfe8'" size="12"
              class="mr-1 flex-shrink-0" />
            <span class="flex-shrink-0">加入于 {{ dateDiff(baseUserInfo.createTime) }}前</span>
            <span v-if="baseUserInfo.email" class="ml-2 opacity-70 truncate" :title="baseUserInfo.email">{{
              baseUserInfo.email }}</span>
          </div>
          <p class="text-sm opacity-90 mt-1 truncate" :title="talksText">{{ talksText }}</p>
        </div>
      </div>
    </div>

    <!-- 数据统计 / 内容导航 -->
    <div class="stats-nav wrapper-item flex-shrink-0 flex">
      <div v-for="item in tabList" :key="item.key"
        class="stat-entry flex-1 flex flex-col items-center justify-center py-2.5 cursor-pointer"
        :class="{ active: activeItem?.key === item.key }" @click="setActiveTabItem(item)">
        <span class="text-xl font-bold leading-none">{{ tabCounts[item.key] || 0 }}</span>
        <span class="text-xs mt-1.5">{{ item.name }}</span>
      </div>
    </div>

    <!-- 心情（可折叠） -->
    <div class="mood-card wrapper-item flex-shrink-0 overflow-hidden">
      <div class="mood-header flex items-center h-10 px-3 cursor-pointer select-none" @click="moodExpand = !moodExpand">
        <AppIcon name="emotion-happy" size="16" class="mr-2 flex-shrink-0"
          :class="{ 'text-[var(--theme-color)]': moodExpand }" />
        <span class="text-sm font-medium">心情</span>
        <span class="ml-2 text-xs text-gray-400">发布的心情会记录在动态中</span>
        <span class="ml-auto flex items-center text-xs text-gray-400 flex-shrink-0">
          <span class="mr-1">{{ moodExpand ? '收起' : '展开' }}</span>
          <AppIcon name="arrow-down" size="14" class="transition-transform duration-200"
            :class="{ 'rotate-180': moodExpand }" />
        </span>
      </div>
      <div class="mood-body px-3" :class="{ open: moodExpand }">
        <div class="mood-body-inner">
          <UserMoodPanel />
        </div>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="content-card wrapper-item flex-1 min-h-[32rem] flex flex-col overflow-hidden">
      <KeepAlive>
        <component :is="activeItem.component"></component>
      </KeepAlive>
    </div>
  </div>
  <UserProfileForm ref="drawerRef" :default-data="baseUserInfo" @send-data="updateUserProfileHandler"></UserProfileForm>
</template>
<script lang="ts" setup>
import { getUserProfileApi, updateUserProfileApi, getUserStatsApi } from '@/api/user';
import { getNoticeUnreadCountApi } from '@/api/notice';
import { UserInfoType, UserFormType } from '@/api/user/type';
import { useUserInfoStore } from '@/store/user';
import UserProfileForm from './components/UserProFileForm.vue';
import UserMoodPanel from './components/UserMoodPanel.vue';
import UserActivity from '../Activity/index.vue';
import UserArticle from '../Article/index.vue';
import UserTask from '../Task/index.vue';
import UserNotice from '../Notice/index.vue';
import type { Component } from 'vue';
import emitter from '@/utils/eventBus';

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

const avatarInitial = computed(() => baseUserInfo.value?.nickName?.trim().charAt(0) || '?');

const talksText = computed(() => baseUserInfo.value?.talks || '这个人很懒，什么都没写~');

// 心情模块折叠状态（默认收起，避免压缩下方内容区）
const moodExpand = ref(false);

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
  {
    name: '消息',
    key: 'notice',
    component: shallowRef(UserNotice),
  },
];
const activeItem = ref<TabItem>(tabList[0]);

// 各 tab 的数据总数，由子组件通过 inject 上报；消息 tab 显示未读数，与顶部角标同源
const tabCounts = reactive<Record<string, number>>({
  article: 0,
  dynamic: 0,
  task: 0,
  notice: 0,
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

/** 消息 tab 的未读数：与顶部角标同源，标记已读后由 notice:refresh 触发同步 */
const getNoticeCountHandler = async () => {
  try {
    const { data } = await getNoticeUnreadCountApi();
    tabCounts.notice = data.count;
  } catch {
    // 未读数非关键路径，静默失败
  }
};

const setActiveTabItem = (item: TabItem) => {
  activeItem.value = item;
};

onMounted(() => {
  getUserInfoHandler();
  getUserStatsHandler();
  getNoticeCountHandler();
  emitter.on('user:stats-refresh', getUserStatsHandler);
  emitter.on('notice:refresh', getNoticeCountHandler);
  const route = useRoute();
  const tabKey = route.query.tab as string;
  const target = tabList.find((item) => item.key === tabKey);
  setActiveTabItem(target || tabList[0]);
});

onUnmounted(() => {
  emitter.off('user:stats-refresh', getUserStatsHandler);
  emitter.off('notice:refresh', getNoticeCountHandler);
});
</script>
<style lang="scss" scoped>
.profile-page {
  min-height: 0;
}

.profile-cover {
  // 窄屏/笔记本上封面适当收窄，给内容区留出更多高度
  height: clamp(10rem, 22vh, 13rem);
  background-color: var(--sys-deep-wrapper-bg-color);
  border: 1px solid var(--sys-border-color);
  border-radius: var(--sys-border-size);
}

.cover-fallback {
  background:
    radial-gradient(120% 140% at 90% -10%, rgba(255, 255, 255, 0.22), transparent 55%),
    linear-gradient(120deg, var(--theme-color), var(--theme-card-bg));
}

.cover-mask {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.55), rgba(0, 0, 0, 0.12) 55%, transparent);
}

.cover-edit-btn {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 999px;
  color: #fff;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(6px);
  transition: background 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.45);
  }
}

.avatar-frame {
  background-color: rgba(255, 255, 255, 0.2);
}

.avatar-initials {
  background: linear-gradient(135deg, var(--theme-color), var(--theme-card-bg));
}

.stats-nav {
  .stat-entry {
    border-left: 1px solid var(--sys-border-color);
    color: var(--sys-text-secondary-color);
    transition: color 0.2s ease;

    &:first-child {
      border-left: none;
    }

    &:hover {
      color: var(--sys-text-color);
    }

    &.active {
      color: var(--theme-color);
    }
  }
}

.mood-card {
  .mood-header {
    color: var(--sys-text-secondary-color);
    transition: color 0.2s ease;

    &:hover {
      color: var(--sys-text-color);
    }
  }

  .mood-body {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.28s ease;

    &.open {
      // 展开高度随视口自适应，为下方内容区保留空间
      max-height: clamp(12rem, calc(100vh - 34rem), 40rem);
      overflow-y: auto;
    }

    .mood-body-inner {
      padding-bottom: 0.75rem;
    }
  }
}
</style>
