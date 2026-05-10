import type { ScopedClient } from '../client';
import type { Address } from '../types';
import type { CreateAddressDto, UpdateAddressDto } from '../dto';

export function createStorefrontAddresses(c: ScopedClient) {
  return {
    list() {
      return c.get<Address[]>('/addresses', 'enduser');
    },

    get(id: string) {
      return c.get<Address>(`/addresses/${id}`, 'enduser');
    },

    create(data: CreateAddressDto) {
      return c.post<Address>('/addresses', data, 'enduser');
    },

    update(id: string, data: UpdateAddressDto) {
      return c.patch<Address>(`/addresses/${id}`, data, 'enduser');
    },

    remove(id: string) {
      return c.del<void>(`/addresses/${id}`, 'enduser');
    },
  };
}
