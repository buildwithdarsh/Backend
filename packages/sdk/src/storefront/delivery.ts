import type { ScopedClient } from '../client';
import type { DeliveryCalculation, DeliveryTracking } from '../types';
import type { CalculateDeliveryDto } from '../dto';

export function createStorefrontDelivery(c: ScopedClient) {
  return {
    calculate(data: CalculateDeliveryDto) {
      return c.post<DeliveryCalculation>('/delivery/calculate', data);
    },

    fee(data: CalculateDeliveryDto) {
      return c.post<DeliveryCalculation>('/delivery/fee', data);
    },

    tracking(orderId: string) {
      return c.get<DeliveryTracking>(`/delivery/orders/${orderId}/tracking`, 'enduser');
    },
  };
}
