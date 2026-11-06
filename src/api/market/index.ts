import type {
  MarketNewsType,
  MarketOverviewType,
  MarketTrendPeriodType,
  MarketTrendType,
} from './type';
import request from '@/utils/request';

export const getMarketOverviewApi = (force = false) =>
  request.post<MarketOverviewType>('/sys/market/overview', { force });

export const getMarketNewsApi = (force = false) =>
  request.post<MarketNewsType>('/sys/market/news', { force });

export const getMarketTrendApi = (data: {
  key: string;
  period: MarketTrendPeriodType;
  force?: boolean;
}) => request.post<MarketTrendType>('/sys/market/trend', data);
