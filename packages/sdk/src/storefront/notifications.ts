import type { ScopedClient } from '../client';
import type { Notification } from '../types';
import type { PaginatedQuery } from '../dto';

export function createStorefrontNotifications(c: ScopedClient) {
  return {
    list(params?: PaginatedQuery) {
      return c.paginated<Notification>('/notifications', params, 'enduser');
    },

    markRead(id: string) {
      return c.post<void>(`/notifications/${id}/read`, undefined, 'enduser');
    },

    markAllRead() {
      return c.post<void>('/notifications/read-all', undefined, 'enduser');
    },
  };
}
