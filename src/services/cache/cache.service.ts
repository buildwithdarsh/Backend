import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

interface CacheEntry {
  value: string;
  expiresAt: number | null; // null = no expiry
}

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly store = new Map<string, CacheEntry>();
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    // Periodic cleanup of expired entries every 60 seconds
    this.cleanupInterval = setInterval(() => this.evictExpired(), 60_000);
    this.logger.log('In-memory cache initialized');
  }

  onModuleDestroy(): void {
    clearInterval(this.cleanupInterval);
    this.store.clear();
    this.logger.log('In-memory cache cleared');
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    try {
      return JSON.parse(entry.value) as T;
    } catch {
      return entry.value as unknown as T;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    this.store.set(key, {
      value: serialized,
      expiresAt:
        ttlSeconds !== undefined && ttlSeconds > 0
          ? Date.now() + ttlSeconds * 1000
          : null,
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async delByPattern(pattern: string): Promise<void> {
    const regex = new RegExp(
      '^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$',
    );
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt !== null && now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}
