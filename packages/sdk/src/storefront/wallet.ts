import type { ScopedClient } from '../client';
import type { WalletPack, WalletBalance, WalletTransaction } from '../types';
import type { TopUpWalletDto } from '../dto';
import type { PaginatedQuery } from '../dto';

export function createStorefrontWallet(c: ScopedClient) {
  return {
    getPacks() {
      return c.get<WalletPack[]>('/wallet/packs');
    },

    getBalance() {
      return c.get<WalletBalance>('/wallet/balance', 'enduser');
    },

    topUp(data: TopUpWalletDto) {
      return c.post<WalletBalance>('/wallet/topup', data, 'enduser');
    },

    getTransactions(params?: PaginatedQuery) {
      return c.paginated<WalletTransaction>('/wallet/transactions', params, 'enduser');
    },
  };
}
