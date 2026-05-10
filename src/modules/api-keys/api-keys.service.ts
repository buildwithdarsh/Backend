import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateApiKeyDto } from './dto/create-api-key.dto.js';
import { UpdateApiKeyDto } from './dto/update-api-key.dto.js';

const BCRYPT_ROUNDS = 10;
/** Number of random bytes for the key body (produces 64-char hex). */
const KEY_BYTES = 32;
/** How many characters of the full key to store as the searchable prefix. */
const PREFIX_LENGTH = 12;

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all API keys for an organization.
   * Never returns the hash — only the prefix, name, and metadata.
   */
  async findAll(orgId: string) {
    const keys = await this.prisma.apiKey.findMany({
      where: { orgId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        environment: true,
        scopes: true,
        rateLimitPerMinute: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return keys;
  }

  /**
   * Get metadata for a single API key. Never returns the hash.
   */
  async findOne(orgId: string, id: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id, orgId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        environment: true,
        scopes: true,
        rateLimitPerMinute: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!key) {
      throw new NotFoundException(`API key with ID "${id}" not found`);
    }

    return key;
  }

  /**
   * Generate a new API key, hash it, and persist.
   * Returns the full plain-text key **only once** during creation.
   */
  async create(orgId: string, dto: CreateApiKeyDto, createdBy: string) {
    const envPrefix = dto.environment === 'live' ? 'tzk_live_' : 'tzk_test_';
    const rawSecret = randomBytes(KEY_BYTES).toString('hex');
    const plainKey = `${envPrefix}${rawSecret}`;

    const keyPrefix = plainKey.slice(0, PREFIX_LENGTH);
    const keyHash = await bcrypt.hash(plainKey, BCRYPT_ROUNDS);

    const record = await this.prisma.apiKey.create({
      data: {
        orgId,
        name: dto.name,
        keyHash,
        keyPrefix,
        environment: dto.environment,
        scopes: dto.scopes,
        rateLimitPerMinute: dto.rateLimitPerMinute ?? 60,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdBy,
      },
    });

    return {
      id: record.id,
      name: record.name,
      keyPrefix: record.keyPrefix,
      environment: record.environment,
      scopes: record.scopes,
      rateLimitPerMinute: record.rateLimitPerMinute,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
      // Plain key returned only at creation time
      plainKey,
    };
  }

  /**
   * Update mutable fields: name, scopes, rate limit.
   */
  async update(orgId: string, id: string, dto: UpdateApiKeyDto) {
    await this.findOne(orgId, id);

    const data: Prisma.ApiKeyUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.scopes !== undefined) data.scopes = dto.scopes;
    if (dto.rateLimitPerMinute !== undefined)
      data.rateLimitPerMinute = dto.rateLimitPerMinute;

    return this.prisma.apiKey.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        environment: true,
        scopes: true,
        rateLimitPerMinute: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Revoke (soft-delete) an API key.
   */
  async revoke(orgId: string, id: string) {
    await this.findOne(orgId, id);

    await this.prisma.apiKey.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    return { revoked: true };
  }

  /**
   * Rotate an API key: revoke the old one and create a new one with the same configuration.
   * Returns the new plain key.
   */
  async rotate(orgId: string, id: string, createdBy: string) {
    const existing = await this.prisma.apiKey.findFirst({
      where: { id, orgId },
    });

    if (!existing) {
      throw new NotFoundException(`API key with ID "${id}" not found`);
    }

    // Revoke the old key
    await this.prisma.apiKey.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    // Create a new key with the same configuration
    const newKey = await this.create(
      orgId,
      {
        name: existing.name,
        environment: existing.environment,
        scopes: existing.scopes,
        rateLimitPerMinute: existing.rateLimitPerMinute,
        ...(existing.expiresAt ? { expiresAt: existing.expiresAt.toISOString() } : {}),
      },
      createdBy,
    );

    return newKey;
  }

  /**
   * Validate an API key for the auth guard.
   *
   * 1. Look up records matching the key prefix.
   * 2. Verify the plain key against each candidate's bcrypt hash.
   * 3. Return the matching record (minus the hash) or `null`.
   */
  async validateKey(keyPrefix: string, plainKey: string) {
    const candidates = await this.prisma.apiKey.findMany({
      where: {
        keyPrefix,
        isActive: true,
        deletedAt: null,
      },
    });

    for (const candidate of candidates) {
      const isMatch = await bcrypt.compare(plainKey, candidate.keyHash);

      if (isMatch) {
        // Check expiration
        if (candidate.expiresAt && candidate.expiresAt < new Date()) {
          this.logger.warn(
            `API key "${candidate.id}" matched but is expired`,
          );
          return null;
        }

        // Update last-used timestamp (fire-and-forget)
        this.prisma.apiKey
          .update({
            where: { id: candidate.id },
            data: { lastUsedAt: new Date() },
          })
          .catch((err) => {
            this.logger.error(
              `Failed to update lastUsedAt for key "${candidate.id}": ${err}`,
            );
          });

        return {
          id: candidate.id,
          orgId: candidate.orgId,
          name: candidate.name,
          environment: candidate.environment,
          scopes: candidate.scopes,
          rateLimitPerMinute: candidate.rateLimitPerMinute,
        };
      }
    }

    return null;
  }
}
