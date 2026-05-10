import type { ScopedClient } from '../client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AppSubscription {
  id: string;
  plan: string;
  amount: number;
  gst: number;
  total: number;
  status: string;
  promoCode?: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  activatedAt?: string;
  expiresAt?: string;
  cancelledAt?: string;
  createdAt: string;
}

// ─── Input types ────────────────────────────────────────────────────────────

export interface CreateSubscriptionInput {
  planId: string;
  promoCode?: string;
}

export interface ActivateSubscriptionInput {
  providerOrderId: string;
  providerPaymentId: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  amount: number;
  gst: number;
  total: number;
}

// ─── Service ────────────────────────────────────────────────────────────────

export function createStorefrontSubscriptions(c: ScopedClient) {
  return {
    getPlans: () => c.get<SubscriptionPlan[]>('/subscriptions/plans'),
    create: (data: CreateSubscriptionInput) => c.post<AppSubscription>('/subscriptions', data, 'enduser'),
    activate: (id: string, data: ActivateSubscriptionInput) => c.post<AppSubscription>(`/subscriptions/${id}/activate`, data, 'enduser'),
    cancel: (id: string) => c.post<AppSubscription>(`/subscriptions/${id}/cancel`, {}, 'enduser'),
    getActive: () => c.get<AppSubscription | null>('/subscriptions/active', 'enduser'),
  };
}
