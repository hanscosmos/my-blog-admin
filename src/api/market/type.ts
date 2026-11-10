export type MarketStatusType = 'open' | 'break' | 'closed' | 'holiday';

export type MarketItemType = {
  key: string;
  name: string;
  symbol?: string;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  precision: number;
  quoteTime: string;
  quoteDate?: string;
};

export type MarketGroupType = {
  key: string;
  name: string;
  status: MarketStatusType;
  statusText: string;
  items: MarketItemType[];
};

export type MarketOverviewType = {
  updateTime: string;
  stale: boolean;
  groups: MarketGroupType[];
};

export type MarketTrendPeriodType = 'minute' | 'hour' | 'day' | 'week' | 'month';

export type MarketTrendMinutePointType = {
  time: string;
  price: number | null;
  avg: number | null;
  volume: number | null;
};

export type MarketTrendKlineItemType = {
  date: string;
  open: number | null;
  close: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
};

export type MarketTrendType = {
  key: string;
  name: string;
  period: MarketTrendPeriodType;
  precision: number;
  preClose?: number | null;
  points?: MarketTrendMinutePointType[];
  items?: MarketTrendKlineItemType[];
};

export type MarketNewsCategoryKeyType = 'finance' | 'world';

export type MarketNewsItemType = {
  id: string;
  category: MarketNewsCategoryKeyType;
  title: string;
  summary: string;
  source: string;
  publishTime: string;
  url: string;
};

export type MarketNewsCategoryType = {
  key: MarketNewsCategoryKeyType;
  name: string;
  items: MarketNewsItemType[];
};

export type MarketNewsFlashType = {
  id: string;
  title: string;
  content: string;
  publishTime: string;
  url: string;
};

export type MarketNewsType = {
  updateTime: string;
  stale: boolean;
  categories: MarketNewsCategoryType[];
  flashes: MarketNewsFlashType[];
};

export type MarketHotSourceKeyType = 'weibo' | 'baidu';

export type MarketHotItemType = {
  rank: number;
  title: string;
  hot: number | null;
  tag: string;
  url: string;
};

export type MarketHotSourceType = {
  key: MarketHotSourceKeyType;
  name: string;
  items: MarketHotItemType[];
};

export type MarketHotType = {
  updateTime: string;
  stale: boolean;
  sources: MarketHotSourceType[];
};

export type MarketFundCategoryType =
  | 'bond'
  | 'equity'
  | 'mixed'
  | 'overseas'
  | 'money'
  | 'commodity'
  | 'other';

export type MarketFundStyleType = 'passive' | 'active' | 'unknown';

export type MarketFundSearchItemType = {
  code: string;
  name: string;
  type: string;
  category: MarketFundCategoryType;
  style: MarketFundStyleType;
  nav: number | null;
  navDate: string;
  company: string;
  manager: string;
};

export type MarketFundHoldingItemType = {
  id: string;
  fundCode: string;
  fundName: string;
  fundType: string;
  category: MarketFundCategoryType;
  style: MarketFundStyleType;
  shares: number;
  costNav: number;
  remark: string;
  sort: number;
  nav: number | null;
  navDate: string;
  estimateNav: number | null;
  estimateChangePercent: number | null;
  estimateTime: string;
  currentNav: number | null;
  prevNav: number | null;
  changePercent: number | null;
  quoteTime: string;
  dataMode: 'estimate' | 'nav' | 'none';
  costAmount: number;
  marketValue: number | null;
  todayPnl: number | null;
  totalPnl: number | null;
  totalReturnRate: number | null;
  dayReturnRate: number | null;
  ratio: number | null;
};

export type MarketFundCategoryStatType = {
  category: MarketFundCategoryType;
  name: string;
  count: number;
  marketValue: number;
  todayPnl: number;
  totalPnl: number;
  ratio: number | null;
};

export type MarketFundSummaryType = {
  totalCost: number;
  totalMarketValue: number;
  totalTodayPnl: number;
  totalPnl: number;
  totalReturnRate: number | null;
  todayReturnRate: number | null;
  incomplete: boolean;
};

export type MarketFundPortfolioType = {
  updateTime: string;
  stale: boolean;
  summary: MarketFundSummaryType;
  categories: MarketFundCategoryStatType[];
  items: MarketFundHoldingItemType[];
};

export type MarketFundHoldingFormType = {
  id?: string;
  fundCode: string;
  shares: number;
  costNav: number;
  category: MarketFundCategoryType;
  style: MarketFundStyleType;
  remark?: string;
  sort?: number;
};
