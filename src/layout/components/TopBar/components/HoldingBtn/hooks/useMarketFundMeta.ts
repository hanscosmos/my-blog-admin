import type {
  MarketFundCategoryType,
  MarketFundStyleType,
} from '@/api/market/type';

export const FUND_CATEGORY_ORDER: MarketFundCategoryType[] = [
  'bond',
  'equity',
  'mixed',
  'overseas',
  'money',
  'commodity',
  'other',
];

export const FUND_CATEGORY_NAMES: Record<MarketFundCategoryType, string> = {
  bond: '债券型',
  equity: '股票/指数',
  mixed: '混合型',
  overseas: '海外/QDII',
  money: '货币型',
  commodity: '商品型',
  other: '其他',
};

export const FUND_CATEGORY_COLORS: Record<MarketFundCategoryType, string> = {
  bond: '#3b82f6',
  equity: '#ef4444',
  mixed: '#f59e0b',
  overseas: '#8b5cf6',
  money: '#10b981',
  commodity: '#eab308',
  other: '#9ca3af',
};

export const FUND_STYLE_LABELS: Record<MarketFundStyleType, string> = {
  passive: '被动',
  active: '主动',
  unknown: '未知',
};

export const FUND_STYLE_COLORS: Record<MarketFundStyleType, string> = {
  passive: '#3b82f6',
  active: '#f59e0b',
  unknown: '#9ca3af',
};

export const CASH_MONEY_FUND_COLOR = '#14b8a6';
export const CASH_DEPOSIT_COLOR = '#0ea5e9';

export const fundCategoryColor = (category: MarketFundCategoryType) =>
  FUND_CATEGORY_COLORS[category] ?? FUND_CATEGORY_COLORS.other;

export const fundStyleLabel = (style: MarketFundStyleType) =>
  FUND_STYLE_LABELS[style] ?? FUND_STYLE_LABELS.unknown;

export const fundStyleColor = (style: MarketFundStyleType) =>
  FUND_STYLE_COLORS[style] ?? FUND_STYLE_COLORS.unknown;
