import { getMarketPhysicalPortfolioApi } from '@/api/market';
import type { MarketPhysicalPortfolioType } from '@/api/market/type';

export function usePhysicalAssetPortfolio() {
  const portfolio = ref<MarketPhysicalPortfolioType | null>(null);
  const loading = ref(false);
  const errorMsg = ref('');

  const fetchPortfolio = async (force = false) => {
    if (loading.value) return;
    loading.value = true;
    try {
      const { data } = await getMarketPhysicalPortfolioApi(force);
      portfolio.value = data;
      errorMsg.value = '';
    } catch (err) {
      console.error('获取实物资产失败:', err);
      errorMsg.value = portfolio.value
        ? `实物资产更新失败，当前展示 ${portfolio.value.updateTime} 的数据`
        : '实物资产加载失败';
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
