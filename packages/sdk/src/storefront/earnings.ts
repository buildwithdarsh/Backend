import type { ScopedClient } from '../client';
import type { EarningsSummary, HostEarning } from '../types';
import type { ListEarningsQuery } from '../dto';

export function createStorefrontEarnings(c: ScopedClient) {
  return {
    getSummary() {
      return c.get<EarningsSummary>('/earnings/summary', 'enduser');
    },

    getHistory(params?: ListEarningsQuery) {
      return c.paginated<HostEarning>('/earnings/history', params, 'enduser');
    },
  };
}
