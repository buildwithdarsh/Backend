/**
 * External provider API endpoints.
 * Centralized here to avoid hardcoded URLs scattered across services/workers.
 */

// ─── MSG91 ──────────────────────────────────────────────────────────────────

export const MSG91 = {
  BASE: 'https://control.msg91.com/api/v5',
  EMAIL_SEND: 'https://control.msg91.com/api/v5/email/send',
  SMS_SEND: 'https://control.msg91.com/api/v5/flow',
  OTP_SEND: 'https://control.msg91.com/api/v5/otp',
  OTP_VERIFY: 'https://control.msg91.com/api/v5/otp/verify',
  OTP_RESEND: 'https://control.msg91.com/api/v5/otp/retry',
  WHATSAPP_SEND: 'https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/',
} as const;

// ─── Razorpay ───────────────────────────────────────────────────────────────

export const RAZORPAY = {
  BASE: 'https://api.razorpay.com/v1',
  ORDERS: 'https://api.razorpay.com/v1/orders',
  PAYMENTS: 'https://api.razorpay.com/v1/payments',
  SUBSCRIPTIONS: 'https://api.razorpay.com/v1/subscriptions',
  REFUNDS: 'https://api.razorpay.com/v1/refunds',
  PAYMENT_LINKS: 'https://api.razorpay.com/v1/payment_links',
  CUSTOMERS: 'https://api.razorpay.com/v1/customers',
} as const;

// ─── Stripe ─────────────────────────────────────────────────────────────────

export const STRIPE = {
  BASE: 'https://api.stripe.com/v1',
  CHARGES: 'https://api.stripe.com/v1/charges',
  CUSTOMERS: 'https://api.stripe.com/v1/customers',
  SUBSCRIPTIONS: 'https://api.stripe.com/v1/subscriptions',
  PAYMENT_INTENTS: 'https://api.stripe.com/v1/payment_intents',
  REFUNDS: 'https://api.stripe.com/v1/refunds',
} as const;

// ─── Resend ─────────────────────────────────────────────────────────────────

export const RESEND = {
  BASE: 'https://api.resend.com',
  EMAILS: 'https://api.resend.com/emails',
} as const;

// ─── Twilio ─────────────────────────────────────────────────────────────────

export const TWILIO = {
  BASE: 'https://api.twilio.com/2010-04-01',
  /** Build full URL: `${TWILIO.MESSAGES(accountSid)}` */
  MESSAGES: (accountSid: string) =>
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
} as const;

// ─── Firebase Cloud Messaging ───────────────────────────────────────────────

export const FCM = {
  SEND: 'https://fcm.googleapis.com/fcm/send',
  SEND_V1: (projectId: string) =>
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
} as const;

// ─── Cloudinary ──────────────────────────────────────────────────────────

export const CLOUDINARY = {
  UPLOAD: (cloudName: string) => `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
  DESTROY: (cloudName: string) => `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
} as const;

// ─── Meta / WhatsApp Cloud API ──────────────────────────────────────────────

export const META_WHATSAPP = {
  API_VERSION: 'v21.0',
  BASE: 'https://graph.facebook.com/v21.0',
  MESSAGES: (phoneNumberId: string) =>
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
} as const;
