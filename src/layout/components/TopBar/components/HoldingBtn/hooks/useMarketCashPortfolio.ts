import { getMarketCashPortfolioApi } from '@/api/market';
import type { MarketCashPortfolioType } from '@/api/market/type';

export function useMarketCashPortfolio() {
  const portfolio = ref<MarketCashPortfolioType | null>(null);
  const loading = ref(false);
  const errorMsg = ref('');

  const fetchPortfolio = async (force = false) => {
    if (loading.value) return;
    loading.value = true;
    try {
      const { data } = await getMarketCashPortfolioApi(force);
      portfolio.value = data;
      errorMsg.value = '';
    } catch (err) {
      console.error('获取现金存款失败:', err);
      errorMsg.value = portfolio.value
        ? `现金存款更新失败，当前展示 ${portfolio.value.updateTime} 的数据`
        : '现金存款加载失败';
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
