import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/index.js';
import { DakshinaBrokerService } from './dakshina-broker.service.js';

@Controller('api/v1/dakshina-broker')
export class DakshinaBrokerController {
  constructor(private readonly broker: DakshinaBrokerService) {}

  /**
   * Called by build.withdarsh.com/pay (the iframe host) immediately after it
   * decrypts the token, before opening Razorpay Checkout.
   *
   * Public — auth is enforced by the AES-256-GCM token (encrypted with
   * DAKSHINA_BROKER_SECRET shared between Khwahish/Website/Backend).
   */
  @Post('init')
  @Public()
  @HttpCode(200)
  init(@Body() body: { token: string }) {
    return this.broker.init(body.token);
  }

  /**
   * Called by build.withdarsh.com/pay after Razorpay Checkout's success handler
   * fires. Verifies HMAC-SHA256 signature, fetches the payment from Razorpay,
   * confirms amount + capture, and stamps the row captured.
   */
  @Post('verify')
  @Public()
  @HttpCode(200)
  verify(
    @Body()
    body: {
      token: string;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    },
  ) {
    return this.broker.verify(body);
  }

  /**
   * Polled by the originating app (Khwahish) every 5s while the iframe is
   * open. Token-gated — anyone with the token can read row status; that's
   * fine, the token already encodes app + callbackId + exp.
   */
  @Get('status')
  @Public()
  status(@Query('token') token: string) {
    return this.broker.status(token);
  }
}
