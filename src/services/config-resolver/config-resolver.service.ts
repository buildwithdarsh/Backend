import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { CacheService } from '../cache/cache.service.js';
import { EncryptionService } from '../encryption/encryption.service.js';

// ─── Custom Exception ────────────────────────────────────────────────────────

export class ProviderNotConfiguredException extends Error {
  constructor(orgId: string, group: string) {
    super(
      `No provider configured for org "${orgId}", group "${group}". ` +
        `Check org_configs and platform_configs tables.`,
    );
    this.name = 'ProviderNotConfiguredException';
  }
}

// ─── Provider Config Types ───────────────────────────────────────────────────

export interface OtpProviderConfig {
  activeProvider: string;
  msg91?: {
    authKey: string;
  };
  twilio?: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
}

export interface EmailProviderConfig {
  activeProvider: string;
  fromName: string | null;
  fromAddress: string | null;
  msg91?: {
    authKey: string;
  };
  smtp?: {
    host: string;
    port: number;
    user: string;
    pass: string;
    secure: boolean;
  };
  resend?: {
    apiKey: string;
  };
}

export interface SmsProviderConfig {
  activeProvider: string;
  msg91?: {
    authKey: string;
    senderId: string;
  };
  twilio?: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
}

export interface WhatsappProviderConfig {
  activeProvider: string;
  msg91?: {
    authKey: string;
    number: string;
  };
}

export interface PaymentProviderConfig {
  activeProvider: string;
  razorpay?: {
    keyId: string;
    keySecret: string;
    webhookSecret: string;
  };
  stripe?: {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
  };
}

export interface PushProviderConfig {
  activeProvider: string;
  fcm?: {
    serverKey: string;
    projectId: string;
  };
}

export interface StorageProviderConfig {
  activeProvider: string;
  s3?: {
    accessKey: string;
    secretKey: string;
    bucket: string;
    region: string;
  };
  r2?: {
    accessKey: string;
    secretKey: string;
    bucket: string;
    endpoint: string;
  };
}

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder: string;
}

export interface OAuthProviderConfig {
  google?: {
    clientId: string;
    clientSecret: string;
  };
  github?: {
    clientId: string;
    clientSecret: string;
  };
}

// ─── Active-provider field mapping ───────────────────────────────────────────

const ACTIVE_PROVIDER_FIELDS: Record<string, string> = {
  otp: 'activeOtpProvider',
  email: 'activeEmailProvider',
  sms: 'activeSmsProvider',
  whatsapp: 'activeWhatsappProvider',
  payment: 'activePaymentProvider',
  push: 'activePushProvider',
  storage: 'activeStorageProvider',
};

/** Cache TTL in seconds (5 minutes). */
const CACHE_TTL_SECONDS = 300;

@Injectable()
export class ConfigResolverService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly encryption: EncryptionService,
  ) {}

  // ─── Core Resolution ────────────────────────────────────────────────────

  /**
   * Resolve a single config value using the hierarchy:
   *   1. org_configs  (org-level override)
   *   2. platform_configs (platform-wide default)
   *   3. throw ProviderNotConfiguredException
   *
   * Secret values stored in the database are automatically decrypted.
   */
  async resolve(orgId: string, group: string, key: string): Promise<string> {
    const cacheKey = `config:${orgId}:${group}`;
    const cached = await this.cache.get<Record<string, string>>(cacheKey);

    if (cached !== null && key in cached) {
      return cached[key] as string;
    }

    // 1. Try org_configs
    const orgConfig = await this.prisma.orgConfig.findUnique({
      where: { orgId },
    });

    if (orgConfig) {
      const orgRecord = orgConfig as unknown as Record<string, unknown>;
      const camelKey = this.toCamelKey(group, key);
      if (camelKey in orgRecord && orgRecord[camelKey] != null) {
        const rawValue = String(orgRecord[camelKey]);
        const value = this.tryDecrypt(rawValue);
        await this.updateGroupCache(cacheKey, key, value);
        return value;
      }
    }

    // 2. Try platform_configs
    const platformConfig = await this.prisma.platformConfig.findUnique({
      where: { group_key: { group, key } },
    });

    if (platformConfig && platformConfig.value !== '') {
      const value = platformConfig.isSecret
        ? this.tryDecrypt(platformConfig.value)
        : platformConfig.value;
      await this.updateGroupCache(cacheKey, key, value);
      return value;
    }

    throw new ProviderNotConfiguredException(orgId, `${group}.${key}`);
  }

  /**
   * Like resolve(), but returns an empty string instead of throwing when
   * the config key is not found or has an empty value.
   */
  async resolveOptional(
    orgId: string,
    group: string,
    key: string,
  ): Promise<string> {
    try {
      return await this.resolve(orgId, group, key);
    } catch {
      return '';
    }
  }

  /**
   * Get the active provider name for a given group (otp, email, sms, etc.).
   * Resolution: org_configs → platform_configs → throw.
   */
  async getActiveProvider(orgId: string, group: string): Promise<string> {
    const activeField = ACTIVE_PROVIDER_FIELDS[group];
    if (!activeField) {
      throw new Error(`Unknown config group: ${group}`);
    }

    // Check org_configs first
    const orgConfig = await this.prisma.orgConfig.findUnique({
      where: { orgId },
    });

    if (orgConfig) {
      const record = orgConfig as unknown as Record<string, unknown>;
      if (activeField in record && record[activeField] != null) {
        return String(record[activeField]);
      }
    }

    // Fall back to platform_configs
    const platformConfig = await this.prisma.platformConfig.findUnique({
      where: { group_key: { group, key: 'active_provider' } },
    });

    if (platformConfig) {
      return platformConfig.value;
    }

    throw new ProviderNotConfiguredException(orgId, group);
  }

  // ─── Convenience Methods ────────────────────────────────────────────────

  async getOtpConfig(orgId: string): Promise<OtpProviderConfig> {
    const activeProvider = await this.getActiveProvider(orgId, 'otp');
    const config: OtpProviderConfig = { activeProvider };

    if (activeProvider === 'msg91') {
      config.msg91 = {
        authKey: await this.resolve(orgId, 'otp', 'msg91_auth_key'),
      };
    } else if (activeProvider === 'twilio') {
      config.twilio = {
        accountSid: await this.resolve(orgId, 'otp', 'twilio_account_sid'),
        authToken: await this.resolve(orgId, 'otp', 'twilio_auth_token'),
        fromNumber: await this.resolve(orgId, 'otp', 'twilio_from_number'),
      };
    }

    return config;
  }

  async getEmailConfig(orgId: string): Promise<EmailProviderConfig> {
    const activeProvider = await this.getActiveProvider(orgId, 'email');
    const config: EmailProviderConfig = {
      activeProvider,
      fromName: await this.safeResolve(orgId, 'email', 'from_name'),
      fromAddress: await this.safeResolve(orgId, 'email', 'from_address'),
    };

    if (activeProvider === 'msg91') {
      config.msg91 = {
        authKey: await this.resolve(orgId, 'email', 'msg91_auth_key'),
      };
    } else if (activeProvider === 'smtp') {
      config.smtp = {
        host: await this.resolve(orgId, 'email', 'smtp_host'),
        port: parseInt(await this.resolve(orgId, 'email', 'smtp_port'), 10),
        user: await this.resolve(orgId, 'email', 'smtp_user'),
        pass: await this.resolve(orgId, 'email', 'smtp_pass'),
        secure:
          (await this.safeResolve(orgId, 'email', 'smtp_secure')) !== 'false',
      };
    } else if (activeProvider === 'resend') {
      config.resend = {
        apiKey: await this.resolve(orgId, 'email', 'resend_api_key'),
      };
    }

    return config;
  }

  async getSmsConfig(orgId: string): Promise<SmsProviderConfig> {
    const activeProvider = await this.getActiveProvider(orgId, 'sms');
    const config: SmsProviderConfig = { activeProvider };

    if (activeProvider === 'msg91') {
      config.msg91 = {
        authKey: await this.resolve(orgId, 'sms', 'msg91_auth_key'),
        senderId: await this.resolve(orgId, 'sms', 'msg91_sender_id'),
      };
    } else if (activeProvider === 'twilio') {
      config.twilio = {
        accountSid: await this.resolve(orgId, 'sms', 'twilio_account_sid'),
        authToken: await this.resolve(orgId, 'sms', 'twilio_auth_token'),
        fromNumber: await this.resolve(orgId, 'sms', 'twilio_from_number'),
      };
    }

    return config;
  }

  async getWhatsappConfig(orgId: string): Promise<WhatsappProviderConfig> {
    const activeProvider = await this.getActiveProvider(orgId, 'whatsapp');
    const config: WhatsappProviderConfig = { activeProvider };

    if (activeProvider === 'msg91') {
      config.msg91 = {
        authKey: await this.resolve(orgId, 'whatsapp', 'msg91_auth_key'),
        number: await this.resolve(orgId, 'whatsapp', 'msg91_number'),
      };
    }

    return config;
  }

  async getPaymentConfig(orgId: string): Promise<PaymentProviderConfig> {
    const activeProvider = await this.getActiveProvider(orgId, 'payment');
    const config: PaymentProviderConfig = { activeProvider };

    if (activeProvider === 'razorpay') {
      config.razorpay = {
        keyId: await this.resolve(orgId, 'payment', 'razorpay_key_id'),
        keySecret: await this.resolve(orgId, 'payment', 'razorpay_key_secret'),
        webhookSecret: await this.resolveOptional(
          orgId,
          'payment',
          'razorpay_webhook_secret',
        ),
      };
    } else if (activeProvider === 'stripe') {
      config.stripe = {
        publishableKey: await this.resolve(
          orgId,
          'payment',
          'stripe_publishable_key',
        ),
        secretKey: await this.resolve(orgId, 'payment', 'stripe_secret_key'),
        webhookSecret: await this.resolve(
          orgId,
          'payment',
          'stripe_webhook_secret',
        ),
      };
    }

    return config;
  }

  async getPushConfig(orgId: string): Promise<PushProviderConfig> {
    const activeProvider = await this.getActiveProvider(orgId, 'push');
    const config: PushProviderConfig = { activeProvider };

    if (activeProvider === 'fcm') {
      config.fcm = {
        serverKey: await this.resolve(orgId, 'push', 'fcm_server_key'),
        projectId: await this.resolve(orgId, 'push', 'fcm_project_id'),
      };
    }

    return config;
  }

  async getStorageConfig(orgId: string): Promise<StorageProviderConfig> {
    const activeProvider = await this.getActiveProvider(orgId, 'storage');
    const config: StorageProviderConfig = { activeProvider };

    if (activeProvider === 's3') {
      config.s3 = {
        accessKey: await this.resolve(orgId, 'storage', 's3_access_key'),
        secretKey: await this.resolve(orgId, 'storage', 's3_secret_key'),
        bucket: await this.resolve(orgId, 'storage', 's3_bucket'),
        region: await this.resolve(orgId, 'storage', 's3_region'),
      };
    } else if (activeProvider === 'r2') {
      config.r2 = {
        accessKey: await this.resolve(orgId, 'storage', 'r2_access_key'),
        secretKey: await this.resolve(orgId, 'storage', 'r2_secret_key'),
        bucket: await this.resolve(orgId, 'storage', 'r2_bucket'),
        endpoint: await this.resolve(orgId, 'storage', 'r2_endpoint'),
      };
    }

    return config;
  }

  async getOAuthConfig(orgId: string): Promise<OAuthProviderConfig> {
    const config: OAuthProviderConfig = {};

    const googleClientId = await this.safeResolve(
      orgId,
      'oauth',
      'google_client_id',
    );
    const googleClientSecret = await this.safeResolve(
      orgId,
      'oauth',
      'google_client_secret',
    );
    if (googleClientId && googleClientSecret) {
      config.google = {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
      };
    }

    const githubClientId = await this.safeResolve(
      orgId,
      'oauth',
      'github_client_id',
    );
    const githubClientSecret = await this.safeResolve(
      orgId,
      'oauth',
      'github_client_secret',
    );
    if (githubClientId && githubClientSecret) {
      config.github = {
        clientId: githubClientId,
        clientSecret: githubClientSecret,
      };
    }

    return config;
  }

  async getCloudinaryConfig(orgId: string): Promise<CloudinaryConfig> {
    // 1. Try org-level override
    const orgConfig = await this.prisma.orgConfig.findUnique({
      where: { orgId },
    });

    if (orgConfig) {
      const record = orgConfig as unknown as Record<string, unknown>;
      const hasOrgCloudinary =
        record['cloudinaryCloudName'] != null && record['cloudinaryApiKey'] != null;

      if (hasOrgCloudinary) {
        const org = await this.prisma.organization.findUnique({
          where: { id: orgId },
          select: { slug: true },
        });
        return {
          cloudName: String(record['cloudinaryCloudName']),
          apiKey: this.tryDecrypt(String(record['cloudinaryApiKey'])),
          apiSecret: this.tryDecrypt(String(record['cloudinaryApiSecret'] ?? '')),
          folder:
            (record['cloudinaryFolder'] as string) || org?.slug || '',
        };
      }
    }

    // 2. Fall back to platform config
    const [cloudName, apiKey, apiSecret] = await Promise.all([
      this.safeResolve(orgId, 'cloudinary', 'cloud_name'),
      this.safeResolve(orgId, 'cloudinary', 'api_key'),
      this.safeResolve(orgId, 'cloudinary', 'api_secret'),
    ]);

    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { slug: true },
    });

    return {
      cloudName: cloudName || 'dakd6siup',
      apiKey: apiKey || '',
      apiSecret: apiSecret || '',
      folder: org?.slug || '',
    };
  }

  // ─── Private Helpers ────────────────────────────────────────────────────

  /**
   * Same as `resolve` but returns `null` instead of throwing
   * when a config key is missing.
   */
  private async safeResolve(
    orgId: string,
    group: string,
    key: string,
  ): Promise<string | null> {
    try {
      return await this.resolve(orgId, group, key);
    } catch (err) {
      if (err instanceof ProviderNotConfiguredException) {
        return null;
      }
      throw err;
    }
  }

  /**
   * Convert a group + snake_case key to the camelCase OrgConfig field name.
   * e.g. ("otp", "msg91_auth_key") → "otpMsg91AuthKey"
   */
  private toCamelKey(group: string, snakeKey: string): string {
    const fullSnake = `${group}_${snakeKey}`;
    return fullSnake.replace(/_([a-z0-9])/g, (_match, char: string) =>
      char.toUpperCase(),
    );
  }

  /**
   * Attempt to decrypt a value. If decryption fails (e.g. the value
   * was stored in plaintext), return the original value.
   */
  private tryDecrypt(value: string): string {
    try {
      return this.encryption.decrypt(value);
    } catch {
      return value;
    }
  }

  /**
   * Merge a key/value into the existing group cache entry
   * and reset the TTL.
   */
  private async updateGroupCache(
    cacheKey: string,
    key: string,
    value: string,
  ): Promise<void> {
    const existing =
      (await this.cache.get<Record<string, string>>(cacheKey)) ?? {};
    existing[key] = value;
    await this.cache.set(cacheKey, existing, CACHE_TTL_SECONDS);
  }
}
