import { getMarketFundPortfolioApi } from '@/api/market';
import type { MarketFundPortfolioType } from '@/api/market/type';

/** 人民币金额格式化，带千分位 */
export const formatCny = (value: number, withSign = false) => {
  const absText = Math.abs(value).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = value < 0 ? '-' : withSign && value > 0 ? '+' : '';
  return `${sign}¥${absText}`;
};

export function useMarketFundPortfolio() {
  const portfolio = ref<MarketFundPortfolioType | null>(null);
  const loading = ref(false);
  const errorMsg = ref('');

  const fetchPortfolio = async (force = false) => {
    if (loading.value) return;
    loading.value = true;
    try {
      const { data } = await getMarketFundPortfolioApi(force);
      portfolio.value = data;
      errorMsg.value = '';
    } catch (err) {
      console.error('获取基金持仓失败:', err);
      errorMsg.value = portfolio.value
        ? `持仓更新失败，当前展示 ${portfolio.value.updateTime} 的数据`
        : '基金持仓加载失败';
    } finally {
      loading.value = false;
    }
  };

  const refresh = () => fetchPortfolio(true);

  onMounted(() => {
    fetchPortfolio();
  });

  return {
    portfolio,
    loading,
    errorMsg,
    refresh,
  };
}
