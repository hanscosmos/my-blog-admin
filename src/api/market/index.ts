import type {
  MarketFundHoldingFormType,
  MarketFundPortfolioType,
  MarketFundSearchItemType,
  MarketHotType,
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

export const getMarketHotApi = (force = false) =>
  request.post<MarketHotType>('/sys/market/hot', { force });

export const getMarketTrendApi = (data: {
  key: string;
  period: MarketTrendPeriodType;
  force?: boolean;
}) => request.post<MarketTrendType>('/sys/market/trend', data);

export const getMarketFundPortfolioApi = (force = false) =>
  request.post<MarketFundPortfolioType>('/sys/market/fund/portfolio', { force });

export const searchMarketFundApi = (keyword: string) =>
  request.post<MarketFundSearchItemType[]>('/sys/market/fund/search', { keyword });

export const saveMarketFundHoldingApi = (data: MarketFundHoldingFormType) =>
  request.post<boolean>('/sys/market/fund/holding/save', data);

export const deleteMarketFundHoldingApi = (data: { ids: string[] }) =>
  request.post<boolean>('/sys/market/fund/holding/delete', data);
