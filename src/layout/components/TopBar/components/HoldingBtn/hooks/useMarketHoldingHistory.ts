import {
  getMarketHoldingHistoryApi,
  recordMarketHoldingSnapshotApi,
} from '@/api/market';
import type { MarketHoldingSnapshotType } from '@/api/market/type';
import { ElMessage } from 'element-plus';

/** 持仓历史快照：趋势图与“记录当前”按钮共用 */
export function useMarketHoldingHistory() {
  const snapshots = ref<MarketHoldingSnapshotType[]>([]);
  const loading = ref(false);
  const recording = ref(false);
  const errorMsg = ref('');
  let requestSeq = 0;

  const fetchHistory = async () => {
    const seq = ++requestSeq;
    loading.value = true;
    try {
      const { data } = await getMarketHoldingHistoryApi();
      if (seq !== requestSeq) return;
      snapshots.value = data;
      errorMsg.value = '';
    } catch (err) {
      if (seq !== requestSeq) return;
      console.error('获取持仓历史失败:', err);
      errorMsg.value = '持仓历史加载失败，请稍后重试';
    } finally {
      if (seq === requestSeq) loading.value = false;
    }
  };

  /**
   * 记录统计快照：keys 为空（默认）时更新全部持仓；
   * 传入大类 / 小类 key 时只更新对应品种。
   */
  const recordSnapshot = async (keys: string[] = []) => {
    if (recording.value) return false;
    recording.value = true;
    try {
      await recordMarketHoldingSnapshotApi(keys);
      await fetchHistory();
      return true;
    } catch (err) {
      console.error('记录持仓快照失败:', err);
      ElMessage.error('记录持仓快照失败，请稍后重试');
      return false;
    } finally {
      recording.value = false;
    }
  };

  return {
    snapshots,
    loading,
    recording,
    errorMsg,
    fetchHistory,
    recordSnapshot,
  };
}
