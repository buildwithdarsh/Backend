import type { ScopedClient } from '../client';
import type { SubmitContactDto, SubscribeNewsletterDto } from '../dto';

export function createStorefrontContact(c: ScopedClient) {
  return {
    submit(data: SubmitContactDto) {
      return c.post<{ message: string }>('/contact', data);
    },

    subscribe(data: SubscribeNewsletterDto) {
      return c.post<{ message: string }>('/contact/subscribe', data);
    },
  };
}
