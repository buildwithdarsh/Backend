import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { PosProviderFactory } from './pos-provider.factory.js';
import type { PosOrderPayload, PosSyncResult, PosOrderResult } from './interfaces/index.js';

@Injectable()
export class PosService {
  private readonly logger = new Logger(PosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerFactory: PosProviderFactory,
  ) {}

  /**
   * Trigger a menu sync from the POS provider and log the result.
   */
  async syncMenu(
    orgId: string,
    source: 'webhook' | 'manual' | 'scheduled' = 'manual',
  ): Promise<PosSyncResult> {
    const startMs = Date.now();
    const provider = await this.providerFactory.resolve(orgId);

    let result: PosSyncResult;
    try {
      result = await provider.syncMenu(orgId);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      result = { success: false, itemCount: 0, errorMsg };
    }

    const durationMs = Date.now() - startMs;

    // Log the sync result
    await this.prisma.posSyncLog.create({
      data: {
        orgId,
        source,
        provider: provider.providerName,
        success: result.success,
        itemCount: result.itemCount,
        errorMsg: result.errorMsg ?? null,
        durationMs,
      },
    });

    this.logger.log(
      `POS sync [${provider.providerName}] for org ${orgId}: ` +
        `success=${result.success}, items=${result.itemCount}, duration=${durationMs}ms`,
    );

    return result;
  }

  /**
   * Push an order to the POS provider.
   */
  async pushOrder(orgId: string, order: PosOrderPayload): Promise<PosOrderResult> {
    const provider = await this.providerFactory.resolve(orgId);

    let result: PosOrderResult;
    try {
      result = await provider.pushOrder(orgId, order);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      result = { success: false, errorMsg };
    }

    this.logger.log(
      `POS pushOrder [${provider.providerName}] for org ${orgId}, ` +
        `order ${order.orderNumber}: success=${result.success}`,
    );

    return result;
  }

  /**
   * List sync logs for an org with pagination.
   */
  async findSyncLogs(orgId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.posSyncLog.findMany({
        where: { orgId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.posSyncLog.count({ where: { orgId } }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
