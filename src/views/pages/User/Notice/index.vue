<template>
  <div class="wh-full">
    <AppSearchPanel :data-exist="dataList.length > 0" :loading="loading">
      <template #header>
        <div class="flex items-center justify-between">
          <el-segmented v-model="pageStatus" :options="statusOptions" @change="changeStatusHandler" />
          <AppButton v-if="hasUnread" type="plain" @click="readAllHandler">
            <AppIcon name="check" class="mr-1"></AppIcon>
            全部已读
          </AppButton>
        </div>
      </template>
      <template #footer>
        <AppPagination :total="total" :page-number="pageConfig.pageNumber" :page-size="pageConfig.pageSize"
          @page-change="pageChangeHandler"></AppPagination>
      </template>
      <ul class="notice-list p-4">
        <li v-for="item in dataList" :key="item.id" class="notice-item" :class="{ unread: !item.isRead }"
          @click="openNotice(item)">
          <img v-if="item.sender.avatar" :src="item.sender.avatar" class="notice-avatar" alt="" />
          <span v-else class="notice-avatar notice-avatar-fallback">{{ item.sender.nickName.charAt(0) || '?' }}</span>
          <div class="notice-body">
            <div class="notice-title">
              <span class="notice-name">{{ item.sender.nickName }}</span>
              <span>{{ getNoticeActionText(item) }}</span>
              <span v-if="!item.isRead" class="notice-unread-dot"></span>
            </div>
            <!-- 回复类消息带上被回复的原评论，便于直接看懂上下文 -->
            <div v-if="item.type === 'comment_reply' && item.rootContent" class="notice-quote">
              你的评论：{{ item.rootContent }}
            </div>
            <div class="notice-content" :class="{ deleted: item.isDeleted }">
              {{ item.isDeleted ? '该评论已删除' : item.content }}
            </div>
            <div class="notice-meta">
              <span class="truncate" :title="item.targetName">{{ item.targetName }}</span>
              <span class="notice-time">{{ fmtTime(item.createTime) }}</span>
            </div>
          </div>
        </li>
      </ul>
    </AppSearchPanel>
  </div>
</template>
<script lang="ts" setup>
import { getNoticeListApi, readAllNoticeApi, readNoticeApi } from '@/api/notice';
import { NoticeItemType, NoticeQueryType } from '@/api/notice/type';
import { useSearch } from '@/hooks/useSearch';
import { getNoticeActionText } from '@/hooks/useNotice';
import emitter from '@/utils/eventBus';

const router = useRouter();

const statusOptions = [
  { label: '全部', value: 'all' },
  { label: '未读', value: 'unread' },
];
const pageStatus = ref<'all' | 'unread'>('all');

// isRead 不传 = 全部；传 false = 只看未读，与后端 filter_read_status 约定一致
const originalParams: NoticeQueryType = { isRead: undefined };

const {
  searchParams,
  dataList,
  loading,
  total,
  pageConfig,
  getDataListHandler,
  pageChangeHandler,
  initDataListHandler,
} = useSearch<NoticeQueryType, NoticeItemType>(originalParams, getNoticeListApi);

const hasUnread = computed(() => dataList.value.some((item) => !item.isRead));

const changeStatusHandler = () => {
  searchParams.value.isRead = pageStatus.value === 'unread' ? false : undefined;
  pageConfig.pageNumber = 1;
  getDataListHandler();
};

/** 标记已读后统一发该事件：顶部角标、个人中心 tab 数字、消息列表据此刷新 */
const refreshNotice = () => {
  emitter.emit('notice:refresh');
};

const openNotice = async (notice: NoticeItemType) => {
  if (!notice.isRead) {
    await readNoticeApi({ ids: [notice.id] });
    notice.isRead = true;
    refreshNotice();
  }
  // 触发的评论已删除时没有可定位的对象，只做已读
  if (notice.isDeleted) return;
  router.push({ name: 'CommentManage', query: { focus: notice.sourceId } });
};

const readAllHandler = async () => {
  await readAllNoticeApi();
  refreshNotice();
};

onMounted(initDataListHandler);

// 从顶部下拉标记已读后，本页列表同步刷新
onMounted(() => emitter.on('notice:refresh', getDataListHandler));
onBeforeUnmount(() => emitter.off('notice:refresh', getDataListHandler));
</script>
<style lang="scss" scoped>
.notice-list {
  margin: 0;
  list-style: none;
}

.notice-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: var(--sys-border-size);
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--sys-deep-wrapper-bg-color);
  }

  &.unread {
    background-color: var(--sys-deep-wrapper-bg-color);
  }
}

.notice-avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.notice-avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #fff;
  background: linear-gradient(135deg, var(--theme-color), var(--theme-card-bg));
}

.notice-body {
  flex: 1;
  min-width: 0;
}

.notice-title {
  display: flex;
  align-items: center;
  font-size: 14px;
  line-height: 20px;
  color: var(--sys-text-color);

  .notice-name {
    margin-right: 4px;
    font-weight: 600;
  }
}

.notice-unread-dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  margin-left: 6px;
  border-radius: 50%;
  background-color: #f56c6c;
}

.notice-quote {
  margin-top: 6px;
  padding: 6px 10px;
  border-left: 2px solid var(--sys-border-color);
  font-size: 12px;
  line-height: 18px;
  color: var(--sys-text-secondary-color);
  background-color: var(--sys-box-bg-color);
}

.notice-content {
  margin-top: 4px;
  font-size: 13px;
  line-height: 20px;
  color: var(--sys-text-color);
  word-break: break-word;

  &.deleted {
    font-style: italic;
    color: var(--sys-text-secondary-color);
  }
}

.notice-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--sys-text-secondary-color);

  .notice-time {
    flex-shrink: 0;
  }
}
</style>
