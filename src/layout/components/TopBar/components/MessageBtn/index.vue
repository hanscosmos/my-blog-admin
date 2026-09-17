<template>
  <el-popover ref="popoverRef" placement="bottom-end" :width="360" trigger="click"
    popper-class="notice-popover" @show="getPreviewList">
    <template #reference>
      <div v-perm="'global:topbar:message'" class="hover-text flex flex-col items-center cursor-pointer">
        <el-badge :value="badgeCount" :hidden="badgeCount === 0" :max="99">
          <AppIcon name="message-one" :size="16"></AppIcon>
        </el-badge>
        <span class="text-xs mt-1">消息</span>
      </div>
    </template>
    <div class="notice-panel">
      <div class="notice-panel-header">
        <span>消息提醒</span>
        <span v-if="badgeCount > 0" class="notice-read-all" @click="readAllNotice">全部已读</span>
      </div>
      <div v-if="loading" class="notice-empty">加载中...</div>
      <div v-else-if="noticeList.length === 0" class="notice-empty">暂无消息</div>
      <ul v-else class="notice-list">
        <li v-for="item in noticeList" :key="item.id" class="notice-item" @click="openNotice(item)">
          <img v-if="item.sender.avatar" :src="item.sender.avatar" class="notice-avatar" alt="" />
          <span v-else class="notice-avatar notice-avatar-fallback">{{ avatarInitial(item) }}</span>
          <div class="notice-body">
            <div class="notice-title">
              <span class="notice-name">{{ item.sender.nickName }}</span>
              <span>{{ getNoticeActionText(item) }}</span>
            </div>
            <div class="notice-content">{{ item.isDeleted ? '该评论已删除' : item.content }}</div>
            <div class="notice-meta">
              <span class="notice-target truncate" :title="item.targetName">{{ item.targetName }}</span>
              <span class="notice-time">{{ fmtTime(item.createTime, 'MM-DD HH:mm') }}</span>
            </div>
          </div>
          <span v-if="!item.isRead" class="notice-unread-dot"></span>
        </li>
      </ul>
      <div class="notice-panel-footer" @click="goNoticePage">查看全部消息</div>
    </div>
  </el-popover>
</template>
<script lang="ts" setup>
import { NoticeItemType } from '@/api/notice/type';
import { getNoticeActionText, useNotice } from '@/hooks/useNotice';

const router = useRouter();
const popoverRef = ref();
const { badgeCount, noticeList, loading, getPreviewList, readNotice, readAllNotice, start, stop } =
  useNotice();

const avatarInitial = (notice: NoticeItemType) => notice.sender.nickName.charAt(0) || '?';

const openNotice = async (notice: NoticeItemType) => {
  await readNotice(notice);
  // 触发的评论已删除时没有可定位的对象，只做已读
  if (notice.isDeleted) return;
  // 跳转前收起下拉，否则它会悬在新页面上
  popoverRef.value?.hide();
  router.push({ name: 'CommentManage', query: { focus: notice.sourceId } });
};

const goNoticePage = () => {
  popoverRef.value?.hide();
  router.push('/user-profile?tab=notice');
};

onMounted(start);
onUnmounted(stop);
</script>
<style lang="scss">
.notice-popover {
  .notice-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
    font-weight: 600;
    color: var(--sys-text-color);
    padding-bottom: 8px;
    border-bottom: 1px solid var(--sys-border-color);
  }

  .notice-read-all {
    font-size: 12px;
    font-weight: 400;
    color: var(--theme-color);
    cursor: pointer;
  }

  .notice-empty {
    padding: 24px 0;
    text-align: center;
    font-size: 12px;
    color: var(--sys-text-secondary-color);
  }

  .notice-list {
    max-height: 380px;
    overflow-y: auto;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .notice-item {
    position: relative;
    display: flex;
    gap: 10px;
    padding: 10px 4px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: rgba(128, 128, 128, 0.15);
    }
  }

  .notice-avatar {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }

  .notice-avatar-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: #fff;
    background: linear-gradient(135deg, var(--theme-color), var(--theme-card-bg));
  }

  .notice-body {
    flex: 1;
    min-width: 0;
    padding-right: 10px;
  }

  .notice-title {
    font-size: 13px;
    color: var(--sys-text-color);
    line-height: 18px;

    .notice-name {
      margin-right: 4px;
      font-weight: 600;
    }
  }

  .notice-content {
    margin-top: 2px;
    font-size: 12px;
    line-height: 17px;
    color: var(--sys-text-secondary-color);
    // 摘要最多两行，避免长评论把下拉撑高
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }

  .notice-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 4px;
    font-size: 12px;
    color: var(--sys-text-secondary-color);

    .notice-target {
      min-width: 0;
      opacity: 0.85;
    }

    .notice-time {
      flex-shrink: 0;
    }
  }

  .notice-unread-dot {
    position: absolute;
    top: 14px;
    right: 0;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #f56c6c;
  }

  .notice-panel-footer {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--sys-border-color);
    text-align: center;
    font-size: 12px;
    color: var(--theme-color);
    cursor: pointer;
  }
}
</style>
