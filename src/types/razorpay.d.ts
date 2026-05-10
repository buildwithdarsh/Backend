declare module 'razorpay' {
  interface RazorpayOptions {
    key_id: string;
    key_secret: string;
  }

  class Razorpay {
    constructor(options: RazorpayOptions);
    customers: any;
    orders: any;
    payments: any;
    subscriptions: any;
    paymentLink: any;
  }

  export default Razorpay;
}
