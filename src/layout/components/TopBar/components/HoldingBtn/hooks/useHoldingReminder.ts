import { getMarketHoldingRemindApi } from '@/api/market';
import { ElNotification } from 'element-plus';
import dayjs from 'dayjs';

const REMIND_KEY_PREFIX = 'holding-remind';
const POLL_INTERVAL = 30 * 60 * 1000; // 30 分钟

/**
 * 周六持仓更新提醒：仅页面打开时生效。
 * 当天没有持仓快照时弹一次通知，并给顶栏按钮加红点。
 */
export function useHoldingReminder(openDialog: () => void) {
  const needRemind = ref(false);
  let timer: ReturnType<typeof setInterval> | null = null;

  const check = async () => {
    try {
      const { data } = await getMarketHoldingRemindApi();
      needRemind.value = data.needRemind;
      if (!data.needRemind) return;

      const key = `${REMIND_KEY_PREFIX}:${dayjs().format('YYYY-MM-DD')}`;
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
      ElNotification({
        title: '持仓更新提醒',
        message: '今天是周六，别忘了更新各品种的持仓金额',
        type: 'warning',
        duration: 10000,
        onClick: openDialog,
      });
    } catch (err) {
      console.log(err);
    }
  };

  const start = () => {
    check();
    timer = setInterval(check, POLL_INTERVAL);
  };

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  return { needRemind, start, stop, refresh: check };
}
