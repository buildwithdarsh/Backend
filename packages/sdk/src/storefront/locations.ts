import type { ScopedClient } from '../client';
import type { StoreLocation } from '../types';

export function createStorefrontLocations(c: ScopedClient) {
  return {
    list() {
      return c.get<StoreLocation[]>('/locations');
    },

    get(id: string) {
      return c.get<StoreLocation>(`/locations/${id}`);
    },
  };
}
