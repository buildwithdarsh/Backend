import type { ScopedClient } from '../client';
import type { PropertyType, PropertyBooking, PropertyAvailability, PropertyPriceResolution } from '../types';
import type {
  CreatePropertyBookingDto, CancelPropertyBookingDto, CreatePropertyPaymentOrderDto,
  VerifyPaymentDto, CheckPropertyAvailabilityQuery, ResolvePropertyPriceDto,
} from '../dto';
import type { StatusQuery } from '../dto';

export function createStorefrontProperty(c: ScopedClient) {
  return {
    getTypes() {
      return c.get<PropertyType[]>('/property/types');
    },

    getType(id: string) {
      return c.get<PropertyType>(`/property/types/${id}`);
    },

    createBooking(data: CreatePropertyBookingDto) {
      return c.post<PropertyBooking>('/property/bookings', data, 'enduser');
    },

    listBookings(params?: StatusQuery) {
      return c.paginated<PropertyBooking>('/property/bookings', params, 'enduser');
    },

    getBooking(id: string) {
      return c.get<PropertyBooking>(`/property/bookings/${id}`, 'enduser');
    },

    cancelBooking(id: string, data?: CancelPropertyBookingDto) {
      return c.post<PropertyBooking>(`/property/bookings/${id}/cancel`, data, 'enduser');
    },

    createPaymentOrder(bookingId: string, data: CreatePropertyPaymentOrderDto) {
      return c.post<{ orderId: string; amount: number }>(`/property/bookings/${bookingId}/payment-order`, data, 'enduser');
    },

    verifyPayment(data: VerifyPaymentDto) {
      return c.post<PropertyBooking>('/property/bookings/verify-payment', data, 'enduser');
    },

    lookupBooking(reference: string) {
      return c.get<PropertyBooking>(`/property/bookings/lookup?reference=${encodeURIComponent(reference)}`);
    },

    checkAvailability(params: CheckPropertyAvailabilityQuery) {
      const qs = new URLSearchParams({
        startDate: params.checkIn,
        endDate: params.checkOut,
      });
      if (params.propertyTypeId) qs.set('propertyTypeId', params.propertyTypeId);
      return c.get<PropertyAvailability[]>(`/property/availability?${qs.toString()}`);
    },

    resolvePrice(data: ResolvePropertyPriceDto) {
      return c.post<PropertyPriceResolution>('/property/pricing/resolve', {
        propertyTypeId: data.propertyTypeId,
        checkInDate: data.checkIn,
        checkOutDate: data.checkOut,
        ...(data.guests != null ? { guestCount: data.guests } : {}),
      });
    },
  };
}
