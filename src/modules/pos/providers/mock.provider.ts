import { Injectable, Logger } from '@nestjs/common';
import type {
  IPosProvider,
  PosSyncResult,
  PosOrderPayload,
  PosOrderResult,
} from '../interfaces/index.js';

@Injectable()
export class MockPosProvider implements IPosProvider {
  private readonly logger = new Logger(MockPosProvider.name);
  readonly providerName = 'mock';

  async syncMenu(orgId: string): Promise<PosSyncResult> {
    this.logger.log(`[Mock] Syncing menu for org ${orgId}`);

    // Simulate a short delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      success: true,
      itemCount: 0,
    };
  }

  async pushOrder(orgId: string, order: PosOrderPayload): Promise<PosOrderResult> {
    this.logger.log(
      `[Mock] Pushing order ${order.orderNumber} for org ${orgId} with ${order.items.length} items`,
    );

    // Simulate a short delay
    await new Promise((resolve) => setTimeout(resolve, 50));

    return {
      success: true,
      posOrderId: `mock-${order.orderId}`,
    };
  }
}
