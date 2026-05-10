import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { EncryptionService } from '../../services/encryption/encryption.service.js';
import { CacheService } from '../../services/cache/cache.service.js';
import { UpdateOrgConfigDto } from './dto/update-org-config.dto.js';
import { UpdatePlatformConfigDto } from './dto/update-platform-config.dto.js';

/**
 * Fields in org_configs that contain secrets and must be encrypted at rest.
 */
const SECRET_FIELDS = new Set<string>([
  'otpMsg91AuthKey',
  'otpTwilioAccountSid',
  'otpTwilioAuthToken',
  'emailMsg91AuthKey',
  'emailSmtpUser',
  'emailSmtpPass',
  'emailResendApiKey',
  'smsMsg91AuthKey',
  'smsTwilioAccountSid',
  'smsTwilioAuthToken',
  'whatsappMsg91AuthKey',
  'paymentRazorpayKeyId',
  'paymentRazorpayKeySecret',
  'paymentRazorpayWebhookSecret',
  'paymentStripePublishableKey',
  'paymentStripeSecretKey',
  'paymentStripeWebhookSecret',
  'pushFcmServerKey',
  'storageS3AccessKey',
  'storageS3SecretKey',
  'storageR2AccessKey',
  'storageR2SecretKey',
  'oauthGoogleClientId',
  'oauthGoogleClientSecret',
  'oauthGithubClientId',
  'oauthGithubClientSecret',
]);

/**
 * Fields that are NOT secret (non-sensitive values, booleans, arrays, etc.).
 */
const NON_SECRET_FIELDS = new Set<string>([
  'activePaymentProvider',
  'activeOtpProvider',
  'activeEmailProvider',
  'activeSmsProvider',
  'activeWhatsappProvider',
  'activePushProvider',
  'activeStorageProvider',
  'emailFromName',
  'emailFromAddress',
  'emailSmtpHost',
  'emailSmtpPort',
  'emailSmtpSecure',
  'smsMsg91SenderId',
  'whatsappMsg91Number',
  'otpTwilioFromNumber',
  'smsTwilioFromNumber',
  'pushFcmProjectId',
  'storageS3Bucket',
  'storageS3Region',
  'storageR2Bucket',
  'storageR2Endpoint',
  'allowedOrigins',
  'ipWhitelist',
  'featureOverrides',
]);

/**
 * Provider group names, mapped to their org_config field prefixes for cache invalidation.
 */
const GROUP_PREFIXES: Record<string, string> = {
  otp: 'otp',
  email: 'email',
  sms: 'sms',
  whatsapp: 'whatsapp',
  payment: 'payment',
  push: 'push',
  storage: 'storage',
  oauth: 'oauth',
};

@Injectable()
export class OrgConfigService {
  private readonly logger = new Logger(OrgConfigService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    private readonly cache: CacheService,
  ) {}

  // ─── Org Config ────────────────────────────────────────────────────────

  /**
   * Get an organization's full config with secret values masked.
   */
  async getOrgConfig(orgId: string) {
    const config = await this.prisma.orgConfig.findUnique({
      where: { orgId },
    });

    if (!config) {
      throw new NotFoundException(`Config not found for organization ${orgId}`);
    }

    return this.maskSecrets(config as unknown as Record<string, unknown>);
  }

  /**
   * Update an organization's config. Secret fields are encrypted before saving.
   * Invalidates the config cache for the affected org.
   */
  async updateOrgConfig(orgId: string, dto: UpdateOrgConfigDto) {
    const existing = await this.prisma.orgConfig.findUnique({
      where: { orgId },
    });

    if (!existing) {
      throw new NotFoundException(`Config not found for organization ${orgId}`);
    }

    const data = this.prepareConfigData(dto);

    const updated = await this.prisma.orgConfig.update({
      where: { orgId },
      data,
    });

    // Invalidate all config cache entries for this org
    await this.cache.delByPattern(`config:${orgId}:*`);

    this.logger.log(`Org config updated for org ${orgId}`);
    return this.maskSecrets(updated as unknown as Record<string, unknown>);
  }

  /**
   * Stub for testing provider connectivity.
   * In production, this would attempt a test API call to the configured provider.
   */
  async testProvider(orgId: string, group: string) {
    const prefix = GROUP_PREFIXES[group];
    if (!prefix) {
      throw new NotFoundException(`Unknown provider group: ${group}`);
    }

    this.logger.log(`Testing provider connectivity for org ${orgId}, group ${group}`);

    return {
      orgId,
      group,
      status: 'not_implemented',
      message: `Provider connectivity test for "${group}" is not yet implemented`,
    };
  }

  /**
   * Reset all config fields for a given provider group to null,
   * falling back to platform defaults.
   */
  async resetGroup(orgId: string, group: string) {
    const prefix = GROUP_PREFIXES[group];
    if (!prefix) {
      throw new NotFoundException(`Unknown provider group: ${group}`);
    }

    const existing = await this.prisma.orgConfig.findUnique({
      where: { orgId },
    });
    if (!existing) {
      throw new NotFoundException(`Config not found for organization ${orgId}`);
    }

    // Build an update object that nullifies all fields for this group
    const resetData: Record<string, null> = {};
    const allFields = [...SECRET_FIELDS, ...NON_SECRET_FIELDS];

    for (const field of allFields) {
      if (field.toLowerCase().startsWith(prefix.toLowerCase())) {
        resetData[field] = null;
      }
    }

    // Also reset the active provider for this group
    const activeProviderField = `active${prefix.charAt(0).toUpperCase()}${prefix.slice(1)}Provider`;
    if (NON_SECRET_FIELDS.has(activeProviderField)) {
      resetData[activeProviderField] = null;
    }

    await this.prisma.orgConfig.update({
      where: { orgId },
      data: resetData,
    });

    await this.cache.delByPattern(`config:${orgId}:*`);

    this.logger.log(`Config group "${group}" reset for org ${orgId}`);
    return {
      message: `Provider group "${group}" has been reset to platform defaults`,
    };
  }

  // ─── Platform Config ──────────────────────────────────────────────────

  /**
   * Get all platform-wide config entries with secrets masked.
   */
  async getPlatformConfig() {
    const configs = await this.prisma.platformConfig.findMany({
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });

    return configs.map((config) => ({
      ...config,
      value: config.isSecret ? this.maskSecret(config.value) : config.value,
    }));
  }

  /**
   * Upsert a platform config entry. Encrypts the value if it is marked as secret.
   */
  async updatePlatformConfig(dto: UpdatePlatformConfigDto) {
    const isSecret = dto.isSecret ?? true;
    const value = isSecret ? this.encryption.encrypt(dto.value) : dto.value;

    const config = await this.prisma.platformConfig.upsert({
      where: { group_key: { group: dto.group, key: dto.key } },
      create: {
        group: dto.group,
        key: dto.key,
        value,
        isSecret,
        description: dto.description ?? null,
      },
      update: {
        value,
        isSecret,
        description: dto.description ?? null,
      },
    });

    // Invalidate all caches for this group across all orgs
    await this.cache.delByPattern(`config:*:${dto.group}`);

    this.logger.log(`Platform config updated: ${dto.group}.${dto.key}`);

    return {
      ...config,
      value: config.isSecret ? this.maskSecret(config.value) : config.value,
    };
  }

  /**
   * Stub for testing platform-level provider connectivity.
   */
  async testPlatformConfig(group: string) {
    if (!GROUP_PREFIXES[group]) {
      throw new NotFoundException(`Unknown provider group: ${group}`);
    }

    this.logger.log(`Testing platform provider connectivity for group ${group}`);

    return {
      group,
      status: 'not_implemented',
      message: `Platform provider connectivity test for "${group}" is not yet implemented`,
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────────────

  /**
   * Mask a secret value, showing only the last 4 characters.
   */
  private maskSecret(value: string): string {
    if (!value || value.length <= 4) {
      return '••••••••';
    }
    return `••••••••${value.slice(-4)}`;
  }

  /**
   * Create a masked copy of an org config record, replacing
   * secret field values with the masked representation.
   */
  private maskSecrets(record: Record<string, unknown>): Record<string, unknown> {
    const masked = { ...record };

    for (const field of SECRET_FIELDS) {
      if (field in masked && masked[field] != null && typeof masked[field] === 'string') {
        masked[field] = this.maskSecret(masked[field] as string);
      }
    }

    return masked;
  }

  /**
   * Prepare DTO data for Prisma update — encrypt any secret fields.
   */
  private prepareConfigData(
    dto: UpdateOrgConfigDto,
  ): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    const raw = dto as unknown as Record<string, unknown>;

    for (const [key, value] of Object.entries(raw)) {
      if (value === undefined) continue;

      if (SECRET_FIELDS.has(key) && typeof value === 'string') {
        data[key] = this.encryption.encrypt(value);
      } else {
        data[key] = value;
      }
    }

    return data;
  }
}
