import type { MarketOverviewType } from './type';
import request from '@/utils/request';

export const getMarketOverviewApi = (force = false) =>
  request.post<MarketOverviewType>('/sys/market/overview', { force });
