import type { ScopedClient } from '../client';
import type { GiftCard } from '../types';
import type { PurchaseGiftCardDto, RedeemGiftCardDto } from '../dto';

export function createStorefrontGiftCards(c: ScopedClient) {
  return {
    purchase(data: PurchaseGiftCardDto) {
      return c.post<GiftCard>('/gift-cards/purchase', data, 'enduser');
    },

    redeem(data: RedeemGiftCardDto) {
      return c.post<GiftCard>('/gift-cards/redeem', data, 'enduser');
    },

    checkBalance(code: string) {
      return c.get<{ balance: number; status: string }>(`/gift-cards/balance?code=${encodeURIComponent(code)}`);
    },
  };
}
