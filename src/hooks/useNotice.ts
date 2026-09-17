import {
  getNoticeListApi,
  getNoticeUnreadCountApi,
  readAllNoticeApi,
  readNoticeApi,
} from '@/api/notice';
import { NoticeItemType } from '@/api/notice/type';
import emitter from '@/utils/eventBus';

const POLL_INTERVAL = 60 * 1000; // 60s 轮询一次
const PREVIEW_SIZE = 8; // 下拉最多展示的条数

/**
 * 站内消息提醒：轮询未读数供顶部角标使用，并按需拉取下拉预览列表。
 * 挂在顶部栏 MessageBtn 中调用。
 */
export const useNotice = () => {
  const badgeCount = ref(0);
  const noticeList = ref<NoticeItemType[]>([]);
  const loading = ref(false);
  let timer: ReturnType<typeof setInterval> | null = null;

  const getUnreadCount = async () => {
    try {
      const { data } = await getNoticeUnreadCountApi();
      badgeCount.value = data.count;
    } catch (err) {
      console.log(err);
    }
  };

  /** 下拉预览：只取最新一页 */
  const getPreviewList = async () => {
    loading.value = true;
    try {
      const { data } = await getNoticeListApi({
        pageNumber: 1,
        pageSize: PREVIEW_SIZE,
      });
      noticeList.value = data.result;
    } catch (err) {
      console.log(err);
    } finally {
      loading.value = false;
    }
  };

  /** 单条已读：先本地置位让下拉即时反馈，失败由随后的未读数拉取纠正 */
  const readNotice = async (notice: NoticeItemType) => {
    if (notice.isRead) return;
    notice.isRead = true;
    badgeCount.value = Math.max(badgeCount.value - 1, 0);
    try {
      await readNoticeApi({ ids: [notice.id] });
    } catch (err) {
      console.log(err);
    }
    emitter.emit('notice:refresh');
  };

  const readAllNotice = async () => {
    await readAllNoticeApi();
    noticeList.value.forEach((item) => (item.isRead = true));
    badgeCount.value = 0;
    emitter.emit('notice:refresh');
  };

  const start = () => {
    getUnreadCount();
    timer = setInterval(getUnreadCount, POLL_INTERVAL);
    // 消息页 / 下拉里标记已读后，角标同步刷新
    emitter.on('notice:refresh', getUnreadCount);
  };

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    emitter.off('notice:refresh', getUnreadCount);
  };

  return {
    badgeCount,
    noticeList,
    loading,
    getPreviewList,
    readNotice,
    readAllNotice,
    start,
    stop,
    refresh: getUnreadCount,
  };
};

/** 消息动作文案：文章被评论 / 留言板被留言 / 评论被回复 */
export const getNoticeActionText = (notice: NoticeItemType) => {
  if (notice.type === 'comment_reply') return '回复了你的评论';
  return notice.targetType === 'article' ? '评论了你的文章' : '在留言板给你留言';
};
