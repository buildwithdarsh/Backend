import { createHmac, timingSafeEqual } from 'node:crypto';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { mintDakshinaToken, verifyDakshinaToken, type DakshinaTokenPayload } from './dakshina-token.js';

const RZP_BASE = 'https://api.razorpay.com/v1';

const ALLOWED_TIERS = new Set([21, 51, 101, 501]);

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

interface RazorpayPayment {
  id: string;
  order_id: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  amount: number;
}

@Injectable()
export class DakshinaBrokerService {
  private readonly logger = new Logger(DakshinaBrokerService.name);

  constructor(private readonly prisma: PrismaService) {}

  private rzpAuthHeader(): string {
    const id = process.env['RAZORPAY_KEY_ID'];
    const secret = process.env['RAZORPAY_KEY_SECRET'];
    if (!id || !secret) throw new BadRequestException('Razorpay keys not configured');
    return `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`;
  }

  /**
   * Called by the Website's /pay page after it decrypts the token. Creates a
   * Razorpay order and persists a DakshinaPayment row so the originating app
   * (Khwahish) can poll for status.
   */
  async init(token: string): Promise<{ orderId: string; amount: number; keyId: string; callbackId: string }> {
    const payload = this.parseToken(token);
    if (!ALLOWED_TIERS.has(payload.amountInr)) {
      throw new BadRequestException('amount not in allowed tier');
    }

    const existing = await this.prisma.dakshinaPayment.findUnique({
      where: { callbackId: payload.callbackId },
    });
    if (existing && existing.status === 'captured') {
      throw new BadRequestException('payment already captured for this callback');
    }

    const res = await fetch(`${RZP_BASE}/orders`, {
      method: 'POST',
      headers: { Authorization: this.rzpAuthHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: payload.amountInr * 100,
        currency: 'INR',
        receipt: `${payload.app}-${payload.shraapId ?? payload.callbackId}`.slice(0, 40),
        payment_capture: 1,
        notes: {
          app: payload.app,
          callbackId: payload.callbackId,
          shraapId: payload.shraapId ?? '',
        },
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      this.logger.error(`Razorpay order create failed: ${res.status} ${text}`);
      throw new BadRequestException('could not create razorpay order');
    }
    const order = (await res.json()) as RazorpayOrder;

    const keyId = process.env['RAZORPAY_KEY_ID']!;

    await this.prisma.dakshinaPayment.upsert({
      where: { callbackId: payload.callbackId },
      create: {
        app: payload.app,
        callbackId: payload.callbackId,
        externalUserRef: payload.shraapId,
        fingerprint: payload.fingerprint,
        amountInr: payload.amountInr,
        razorpayOrderId: order.id,
        status: 'pending',
        expiresAt: new Date(payload.exp * 1000),
      },
      update: {
        razorpayOrderId: order.id,
        amountInr: payload.amountInr,
        status: 'pending',
        failureReason: null,
        expiresAt: new Date(payload.exp * 1000),
      },
    });

    return {
      orderId: order.id,
      amount: order.amount,
      keyId,
      callbackId: payload.callbackId,
    };
  }

  /**
   * Called by the Website with the Razorpay handler payload. Verifies the
   * Razorpay signature, fetches the payment status server-side, and marks the
   * row captured/failed. Idempotent on success.
   */
  async verify(args: {
    token: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<{ status: 'captured' | 'failed'; callbackId: string }> {
    const payload = this.parseToken(args.token);
    const row = await this.prisma.dakshinaPayment.findUnique({
      where: { callbackId: payload.callbackId },
    });
    if (!row) throw new NotFoundException('callback not found');
    if (row.status === 'captured') return { status: 'captured', callbackId: payload.callbackId };
    if (row.razorpayOrderId !== args.razorpayOrderId) {
      throw new BadRequestException('order mismatch');
    }

    if (!this.verifyCheckoutSignature(args.razorpayOrderId, args.razorpayPaymentId, args.razorpaySignature)) {
      await this.markFailed(payload.callbackId, 'signature mismatch');
      throw new BadRequestException('signature mismatch');
    }

    const payment = await this.fetchPayment(args.razorpayPaymentId);
    if (payment.order_id !== args.razorpayOrderId) {
      await this.markFailed(payload.callbackId, 'order/payment mismatch');
      throw new BadRequestException('order mismatch');
    }
    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      await this.markFailed(payload.callbackId, `payment status ${payment.status}`);
      throw new BadRequestException(`payment not captured (${payment.status})`);
    }
    if (payment.amount !== row.amountInr * 100) {
      await this.markFailed(payload.callbackId, 'amount mismatch');
      throw new BadRequestException('amount mismatch');
    }

    await this.prisma.dakshinaPayment.update({
      where: { callbackId: payload.callbackId },
      data: {
        razorpayPaymentId: args.razorpayPaymentId,
        status: 'captured',
        verifiedAt: new Date(),
      },
    });
    return { status: 'captured', callbackId: payload.callbackId };
  }

  /**
   * Called by Khwahish polling. Returns just the status — never the Razorpay
   * payment id (that stays internal).
   */
  async status(token: string): Promise<{
    status: 'pending' | 'captured' | 'failed' | 'expired';
    callbackId: string;
    amountInr: number;
  }> {
    const payload = this.parseToken(token);
    const row = await this.prisma.dakshinaPayment.findUnique({
      where: { callbackId: payload.callbackId },
    });
    if (!row) {
      return { status: 'pending', callbackId: payload.callbackId, amountInr: payload.amountInr };
    }
    return { status: row.status, callbackId: row.callbackId, amountInr: row.amountInr };
  }

  // ── helpers ────────────────────────────────────────────────────────────────

  private parseToken(token: string): DakshinaTokenPayload {
    try {
      return verifyDakshinaToken(token);
    } catch (err) {
      this.logger.warn(`token rejected: ${(err as Error).message}`);
      throw new BadRequestException('invalid token');
    }
  }

  private verifyCheckoutSignature(orderId: string, paymentId: string, signature: string): boolean {
    const secret = process.env['RAZORPAY_KEY_SECRET'];
    if (!secret) return false;
    const expected = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
    if (expected.length !== signature.length) return false;
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  }

  private async fetchPayment(paymentId: string): Promise<RazorpayPayment> {
    const res = await fetch(`${RZP_BASE}/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: this.rzpAuthHeader() },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      this.logger.error(`Razorpay fetchPayment failed: ${res.status} ${text}`);
      throw new BadRequestException('could not verify payment with Razorpay');
    }
    return (await res.json()) as RazorpayPayment;
  }

  private async markFailed(callbackId: string, reason: string): Promise<void> {
    try {
      await this.prisma.dakshinaPayment.update({
        where: { callbackId },
        data: { status: 'failed', failureReason: reason },
      });
    } catch {
      /* swallow */
    }
  }

  // Re-export the shared minter so other Backend modules can mint tokens too.
  static mintToken = mintDakshinaToken;
}
