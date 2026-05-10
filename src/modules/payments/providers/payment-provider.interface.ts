// ─── Input Data Types ───────────────────────────────────────────────────────

export interface CreateCustomerData {
  email?: string;
  phone?: string;
  name?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateOrderData {
  amount: number;
  currency: string;
  receipt?: string;
  notes?: Record<string, string>;
}

export interface VerifyPaymentData {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface CapturePaymentData {
  paymentId: string;
  amount: number;
  currency: string;
}

export interface CreatePlanData {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  name: string;
  amount: number; // in major currency units (e.g. INR, not paise)
  currency: string;
  description?: string;
  notes?: Record<string, string>;
}

export interface CreateSubscriptionData {
  planId: string;
  customerId?: string;
  quantity?: number;
  totalCount?: number;
  notes?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface CreateRefundData {
  paymentId: string;
  amount?: number;
  reason?: string;
  notes?: Record<string, string>;
}

export interface CreatePaymentLinkData {
  name: string;
  description?: string;
  amount: number;
  currency: string;
  type: 'one_time' | 'subscription';
  successUrl?: string;
  cancelUrl?: string;
  expiresAt?: Date;
  maxUses?: number;
  notes?: Record<string, string>;
}

// ─── Return Types ───────────────────────────────────────────────────────────

export interface ProviderCustomer {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
}

export interface ProviderOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
  receipt?: string;
}

export interface ProviderPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  method?: string;
  capturedAt?: Date;
}

export interface ProviderPlan {
  id: string;
  period: string;
  interval: number;
  name: string;
  amount: number;
  currency: string;
}

export interface ProviderSubscription {
  id: string;
  planId: string;
  customerId?: string;
  status: string;
  shortUrl?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  quantity?: number;
}

export interface ProviderRefund {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
}

export interface ProviderPaymentLink {
  id: string;
  url: string;
  amount: number;
  currency: string;
  status: string;
}

// ─── Webhook Event ──────────────────────────────────────────────────────────

export interface WebhookEvent {
  type: string;
  provider: 'razorpay' | 'stripe';
  data: Record<string, unknown>;
}

// ─── Provider Interface ─────────────────────────────────────────────────────

export interface IPaymentProvider {
  readonly providerName: 'razorpay' | 'stripe';

  createPlan(data: CreatePlanData): Promise<ProviderPlan>;
  createCustomer(data: CreateCustomerData): Promise<ProviderCustomer>;
  createOrder(data: CreateOrderData): Promise<ProviderOrder>;
  verifyPayment(data: VerifyPaymentData): Promise<boolean>;
  capturePayment(data: CapturePaymentData): Promise<ProviderPayment>;
  createSubscription(data: CreateSubscriptionData): Promise<ProviderSubscription>;
  pauseSubscription(id: string): Promise<void>;
  resumeSubscription(id: string): Promise<void>;
  cancelSubscription(id: string): Promise<void>;
  createRefund(data: CreateRefundData): Promise<ProviderRefund>;
  createPaymentLink(data: CreatePaymentLinkData): Promise<ProviderPaymentLink>;
  constructWebhookEvent(payload: unknown, signature: string, secret: string): Promise<WebhookEvent>;
}
