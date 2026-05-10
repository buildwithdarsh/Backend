import type { ScopedClient } from '../client';
import type { LoyaltyAccount, LoyaltyTransaction, LoyaltyReward, LoyaltyRedemption } from '../types';
import type { RedeemLoyaltyRewardDto } from '../dto';

export function createStorefrontLoyalty(c: ScopedClient) {
  return {
    getAccount() {
      return c.get<LoyaltyAccount>('/loyalty', 'enduser');
    },

    getTransactions() {
      return c.get<LoyaltyTransaction[]>('/loyalty/transactions', 'enduser');
    },

    getRewards() {
      return c.get<LoyaltyReward[]>('/loyalty/rewards', 'enduser');
    },

    getRedemptions() {
      return c.get<LoyaltyRedemption[]>('/loyalty/redeem', 'enduser');
    },

    redeem(data: RedeemLoyaltyRewardDto) {
      return c.post<LoyaltyRedemption>('/loyalty/redeem', data, 'enduser');
    },
  };
}
