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

export type MarketTrendPeriodType = 'minute' | 'day' | 'week' | 'month';

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

export type MarketNewsCategoryKeyType = 'finance' | 'world' | 'society';

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
