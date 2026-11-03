export type MarketStatusType = 'open' | 'break' | 'closed' | 'holiday';

export type MarketItemType = {
  key: string;
  name: string;
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
