import type { ScopedClient } from '../client';
import type { Order } from '../types';
import type { CreateOrderDto, ListOrdersQuery, ReorderDto, ReportOrderIssueDto } from '../dto';

export function createStorefrontOrders(c: ScopedClient) {
  return {
    create(data: CreateOrderDto) {
      return c.post<Order>('/orders', data, 'enduser');
    },

    list(params?: ListOrdersQuery) {
      return c.paginated<Order>('/orders', params, 'enduser');
    },

    get(id: string) {
      return c.get<Order>(`/orders/${id}`, 'enduser');
    },

    reorder(data: ReorderDto) {
      return c.post<Order>('/orders/reorder', data, 'enduser');
    },

    reportIssue(orderId: string, data: ReportOrderIssueDto) {
      return c.post<{ ticketId: string }>(`/orders/${orderId}/issue`, data, 'enduser');
    },
  };
}
