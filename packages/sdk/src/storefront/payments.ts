import type { ScopedClient } from '../client';
import type { PaymentOrder, PaymentVerification } from '../types';
import type { CreatePaymentOrderDto, VerifyPaymentDto } from '../dto';

export function createStorefrontPayments(c: ScopedClient) {
  return {
    createOrder(data: CreatePaymentOrderDto) {
      return c.post<PaymentOrder>('/payments/create-order', data, 'enduser');
    },

    verify(data: VerifyPaymentDto) {
      return c.post<PaymentVerification>('/payments/verify', data, 'enduser');
    },
  };
}
