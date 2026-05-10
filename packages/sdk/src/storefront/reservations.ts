import type { ScopedClient } from '../client';
import type { ReservationSlot, Reservation } from '../types';
import type { CheckReservationAvailabilityQuery, CreateReservationDto } from '../dto';
import type { StatusQuery } from '../dto';

export function createStorefrontReservations(c: ScopedClient) {
  return {
    checkAvailability(params: CheckReservationAvailabilityQuery) {
      return c.get<ReservationSlot[]>(`/reservations/availability?date=${params.date}${params.partySize ? `&partySize=${params.partySize}` : ''}`);
    },

    create(data: CreateReservationDto) {
      return c.post<Reservation>('/reservations', data, 'enduser');
    },

    list(params?: StatusQuery) {
      return c.paginated<Reservation>('/reservations', params, 'enduser');
    },

    cancel(id: string) {
      return c.post<Reservation>(`/reservations/${id}/cancel`, undefined, 'enduser');
    },
  };
}
