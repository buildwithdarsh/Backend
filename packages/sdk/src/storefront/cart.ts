import type { ScopedClient } from '../client';
import type { Cart, CartLineItem } from '../types';
import type { AddCartItemDto, UpdateCartItemDto } from '../dto';

export function createStorefrontCart(c: ScopedClient) {
  return {
    get() {
      return c.get<Cart>('/cart', 'enduser');
    },

    addItem(data: AddCartItemDto) {
      return c.post<CartLineItem>('/cart/items', data, 'enduser');
    },

    updateItem(itemId: string, data: UpdateCartItemDto) {
      return c.patch<CartLineItem>(`/cart/items/${itemId}`, data, 'enduser');
    },

    removeItem(itemId: string) {
      return c.del<void>(`/cart/items/${itemId}`, 'enduser');
    },

    validate() {
      return c.post<Cart>('/cart/validate', undefined, 'enduser');
    },

    clear() {
      return c.del<void>('/cart', 'enduser');
    },
  };
}
