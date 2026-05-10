import type { ScopedClient } from '../client';
import type { StorefrontConfig } from '../types';

export function createStorefrontConfig(c: ScopedClient) {
  return {
    get() {
      return c.get<StorefrontConfig>('/config');
    },
  };
}
