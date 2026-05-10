declare module 'stripe' {
  class Stripe {
    constructor(apiKey: string, config?: any);
    customers: any;
    paymentIntents: any;
    subscriptions: any;
    refunds: any;
    paymentLinks: any;
    webhooks: {
      constructEvent(payload: any, signature: string, secret: string): any;
    };
  }

  export default Stripe;
}
