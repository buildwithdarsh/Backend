import type { ScopedClient } from '../client';
import type { Promotion } from '../types';

export function createStorefrontPromotions(c: ScopedClient) {
  return {
    list() {
      return c.get<Promotion[]>('/promotions');
    },
  };
}
