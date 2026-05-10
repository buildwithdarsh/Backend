import type { ScopedClient } from '../client';
import type { SupportTicket, SupportReply } from '../types';
import type { CreateSupportTicketDto, ReplySupportTicketDto } from '../dto';
import type { StatusQuery } from '../dto';

export function createStorefrontSupport(c: ScopedClient) {
  return {
    create(data: CreateSupportTicketDto) {
      return c.post<SupportTicket>('/support', data, 'enduser');
    },

    list(params?: StatusQuery) {
      return c.paginated<SupportTicket>('/support', params, 'enduser');
    },

    reply(ticketId: string, data: ReplySupportTicketDto) {
      return c.post<SupportReply>(`/support/${ticketId}/reply`, data, 'enduser');
    },
  };
}
