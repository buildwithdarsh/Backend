import { Injectable, Logger } from '@nestjs/common';
import type { IPosProvider } from './interfaces/index.js';
import { MockPosProvider } from './providers/mock.provider.js';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class PosProviderFactory {
  private readonly logger = new Logger(PosProviderFactory.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mockProvider: MockPosProvider,
  ) {}

  /**
   * Resolve the POS provider for a given organization.
   * Reads the org settings to determine which provider to use.
   * Falls back to the mock provider if none is configured.
   */
  async resolve(orgId: string): Promise<IPosProvider> {
    const setting = await this.prisma.orgSettings.findUnique({
      where: { orgId_group_key: { orgId, group: 'pos', key: 'provider' } },
    });

    const providerName = setting?.value ?? 'mock';

    switch (providerName) {
      case 'mock':
        return this.mockProvider;
      // Future providers can be added here:
      // case 'petpooja':
      //   return this.petpoojaProvider;
      default:
        this.logger.warn(
          `Unknown POS provider "${providerName}" for org ${orgId}, falling back to mock`,
        );
        return this.mockProvider;
    }
  }
}
