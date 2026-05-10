export const ConversationState = {
  IDLE: 'idle',
  STORE_SELECT: 'store_select',
  BROWSING: 'browsing',
  CART: 'cart',
  ORDER_TYPE: 'order_type',
  ADDRESS_PENDING: 'address_pending',
  PAYMENT: 'payment',
  PLACING: 'placing',
  TRACKING: 'tracking',
} as const;

export type ConversationStateType = (typeof ConversationState)[keyof typeof ConversationState];
