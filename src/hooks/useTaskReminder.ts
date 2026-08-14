import { getUserTaskRemindListApi } from '@/api/user/task';
import { UserTaskItemType } from '@/api/user/task/type';
import { ElNotification } from 'element-plus';
import dayjs from 'dayjs';
import emitter from '@/utils/eventBus';

const REMIND_KEY_PREFIX = 'task-remind';
const POLL_INTERVAL = 60 * 1000; // 60s 轮询一次
const UPCOMING_WINDOW = 24 * 3600 * 1000; // 角标/下拉展示未来 24h 内到期

/**
 * 待办事项提醒：轮询未完成任务，到点弹通知，并对外暴露顶部角标所需数据。
 * 挂在顶部栏 TodoListBtn 中调用。
 */
export const useTaskReminder = () => {
  const router = useRouter();
  const badgeCount = ref(0);
  const upcomingTasks = ref<UserTaskItemType[]>([]);
  let timer: ReturnType<typeof setInterval> | null = null;

  // 触发时间 = 截止时间 - 提前量（分钟）
  const getTriggerTime = (task: UserTaskItemType) =>
    dayjs(task.deadline).subtract(task.remindBeforeMinutes, 'minute').valueOf();

  const isOverdue = (task: UserTaskItemType) =>
    dayjs(task.deadline).valueOf() < Date.now();

  const fireReminder = (task: UserTaskItemType) => {
    const trigger = getTriggerTime(task);
    const key = `${REMIND_KEY_PREFIX}:${task.id}:${trigger}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    ElNotification({
      title: '待办事项提醒',
      message: `「${task.title}」将于 ${dayjs(task.deadline).format('YYYY-MM-DD HH:mm')} 截止`,
      type: 'warning',
      duration: 10000,
      onClick: () => router.push('/user-profile?tab=task'),
    });
  };

  const getRemindList = async () => {
    try {
      const { data } = await getUserTaskRemindListApi();
      const now = Date.now();
      // 顶部角标/下拉：已逾期（不限时长）+ 未来 24h 内到期
      upcomingTasks.value = data.filter(
        (item) => dayjs(item.deadline).valueOf() <= now + UPCOMING_WINDOW
      );
      badgeCount.value = upcomingTasks.value.length;
      // 弹窗提醒：开启了提醒且已到触发时间，每个任务只弹一次
      data
        .filter((item) => item.remindBeforeMinutes >= 0)
        .forEach((item) => {
          if (getTriggerTime(item) <= now) fireReminder(item);
        });
    } catch (err) {
      console.log(err);
    }
  };

  const start = () => {
    getRemindList();
    timer = setInterval(getRemindList, POLL_INTERVAL);
    emitter.on('task:refresh', getRemindList);
  };

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    emitter.off('task:refresh', getRemindList);
  };

  return { badgeCount, upcomingTasks, isOverdue, start, stop, refresh: getRemindList };
};
