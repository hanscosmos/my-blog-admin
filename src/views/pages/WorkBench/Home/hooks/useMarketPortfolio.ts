import type { MarketItemType } from '@/api/market/type';
import type { MaybeRefOrGetter } from 'vue';
import { useStorage } from '@vueuse/core';
import type { MarketDisplayItemType } from './useMarketLayout';

export type MarketPnlType = {
  /** 持仓市值（人民币） */
  amount: number;
  /** 当日盈亏（人民币） */
  pnl: number;
};

/** 计算单条资产当日盈亏；未配置持仓或缺少涨跌幅时返回 null */
export const calcMarketPnl = (
  item: MarketItemType,
  amount: number | undefined
): MarketPnlType | null => {
  if (!amount || amount <= 0) return null;
  if (item.changePercent === null || item.changePercent === undefined) {
    return null;
  }

  return {
    amount,
    pnl: (amount * item.changePercent) / 100,
  };
};

/** 人民币金额格式化，带千分位 */
export const formatCny = (value: number, withSign = false) => {
  const absText = Math.abs(value).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = value < 0 ? '-' : withSign && value > 0 ? '+' : '';
  return `${sign}¥${absText}`;
};

export const formatPnlValue = (pnl: MarketPnlType) =>
  formatCny(pnl.pnl, true);

export function useMarketPortfolio(options: {
  favorites: MaybeRefOrGetter<MarketDisplayItemType[]>;
}) {
  /** uid -> 持仓市值（人民币） */
  const positions = useStorage<Record<string, number>>(
    'market-portfolio-amounts',
    {}
  );

  const favorites = computed(() => toValue(options.favorites));

  const getPnl = (item: MarketDisplayItemType) =>
    calcMarketPnl(item, positions.value[item.uid]);

  const totalPnlCny = computed(() =>
    favorites.value.reduce(
      (total, item) => total + (getPnl(item)?.pnl ?? 0),
      0
    )
  );

  /** 是否存在可展示的盈亏数据 */
  const hasPnlData = computed(() =>
    favorites.value.some((item) => getPnl(item) !== null)
  );

  const savePositions = (source: Record<string, number>) => {
    const next: Record<string, number> = {};
    Object.entries(source).forEach(([uid, amount]) => {
      if (typeof amount === 'number' && Number.isFinite(amount) && amount > 0) {
        next[uid] = amount;
      }
    });
    positions.value = next;
  };

  return {
    positions,
    getPnl,
    totalPnlCny,
    hasPnlData,
    savePositions,
  };
}
