import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

/**
 * Ensure the connection string includes pool sizing params.
 * If they're already set via env, these defaults won't override them.
 */
function appendPoolParams(url: string): string {
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has('connection_limit')) {
      parsed.searchParams.set('connection_limit', '10');
    }
    if (!parsed.searchParams.has('pool_timeout')) {
      parsed.searchParams.set('pool_timeout', '20');
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Prisma model names whose underlying tables are append-only logs.
 * Soft-delete filtering and auto-`updated_at` must NOT apply to these.
 */
const LOG_MODELS = new Set<string>([
  'AuditLog',
  'UsageLog',
  'CampaignLog',
]);

/**
 * Prisma model names that carry a `deleted_at` column and therefore
 * participate in soft-delete filtering.
 */
const SOFT_DELETE_MODELS = new Set<string>([
  'Organization',
  'SuperAdmin',
  'User',
  'Role',
  'EndUser',
  'Segment',
  'ApiKey',
  'Notification',
  'NotificationTemplate',
  'Campaign',
  'Webhook',
  'PaymentCustomer',
  'Product',
  'Order',
  'Subscription',
  'Refund',
  'PaymentLink',
  'Invoice',
  'BankAccount',
  'Beneficiary',
]);

function softDeleteExtension() {
  return Prisma.defineExtension({
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (model && SOFT_DELETE_MODELS.has(model) && !LOG_MODELS.has(model)) {
            const where = (args.where ?? {}) as Record<string, unknown>;
            if (!('deletedAt' in where)) {
              args.where = { ...where, deletedAt: null };
            }
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (model && SOFT_DELETE_MODELS.has(model) && !LOG_MODELS.has(model)) {
            const where = (args.where ?? {}) as Record<string, unknown>;
            if (!('deletedAt' in where)) {
              args.where = { ...where, deletedAt: null };
            }
          }
          return query(args);
        },
        async findFirstOrThrow({ model, args, query }) {
          if (model && SOFT_DELETE_MODELS.has(model) && !LOG_MODELS.has(model)) {
            const where = (args.where ?? {}) as Record<string, unknown>;
            if (!('deletedAt' in where)) {
              args.where = { ...where, deletedAt: null };
            }
          }
          return query(args);
        },
        async findUnique({ model, args, query }) {
          if (model && SOFT_DELETE_MODELS.has(model) && !LOG_MODELS.has(model)) {
            const where = (args.where ?? {}) as Record<string, unknown>;
            if (!('deletedAt' in where)) {
              args.where = { ...where, deletedAt: null } as typeof args.where;
            }
          }
          return query(args);
        },
        async findUniqueOrThrow({ model, args, query }) {
          if (model && SOFT_DELETE_MODELS.has(model) && !LOG_MODELS.has(model)) {
            const where = (args.where ?? {}) as Record<string, unknown>;
            if (!('deletedAt' in where)) {
              args.where = { ...where, deletedAt: null } as typeof args.where;
            }
          }
          return query(args);
        },
      },
    },
  });
}

function updatedAtExtension() {
  return Prisma.defineExtension({
    query: {
      $allModels: {
        async update({ model, args, query }) {
          if (model && !LOG_MODELS.has(model)) {
            args.data = { ...args.data, updatedAt: new Date() };
          }
          return query(args);
        },
        async updateMany({ model, args, query }) {
          if (model && !LOG_MODELS.has(model)) {
            args.data = { ...args.data, updatedAt: new Date() };
          }
          return query(args);
        },
        async upsert({ model, args, query }) {
          if (model && !LOG_MODELS.has(model)) {
            args.update = { ...args.update, updatedAt: new Date() };
          }
          return query(args);
        },
      },
    },
  });
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  /**
   * The extended client with soft-delete and updated_at middleware.
   * All query operations should go through this delegate.
   */
  private _extended: unknown = null;

  constructor() {
    super({
      datasourceUrl: appendPoolParams(process.env['DATABASE_URL'] ?? ''),
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });
  }

  private _createExtendedClient() {
    return (this as PrismaClient)
      .$extends(softDeleteExtension())
      .$extends(updatedAtExtension());
  }

  /**
   * Access the extended PrismaClient that has soft-delete filtering
   * and auto-updated_at middleware applied.
   */
  get extended() {
    if (!this._extended) {
      this._extended = this._createExtendedClient();
    }
    return this._extended;
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('Connecting to database...');
    await this.$connect();
    this.logger.log('Database connected');
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Disconnecting from database...');
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  /**
   * Enable shutdown hooks so Prisma can disconnect cleanly
   * when the NestJS application receives a termination signal.
   *
   * @deprecated NestJS 10+ handles shutdown hooks natively via
   * `app.enableShutdownHooks()`, but this helper is retained for
   * backward-compatible setups.
   */
  enableShutdownHooks(app: { close: () => Promise<void> }): void {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}
