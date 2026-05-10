import { Injectable } from '@nestjs/common';
import {
  ConfigResolverService,
  StorageProviderConfig,
} from '../config-resolver/config-resolver.service.js';

// ─── S3/R2 Client Types ──────────────────────────────────────────────────────
// Lightweight interfaces mirroring the AWS SDK shapes so the file compiles
// without `@aws-sdk/client-s3` installed. The actual SDK classes are loaded
// dynamically at runtime via `import()`.

interface S3ClientLike {
  send(command: unknown): Promise<unknown>;
  destroy(): void;
}

@Injectable()
export class StorageService {
  /**
   * Per-org S3Client cache keyed by `orgId:provider`.
   * Avoids re-creating clients on every request.
   */
  private readonly clients = new Map<string, S3ClientLike>();

  constructor(private readonly configResolver: ConfigResolverService) {}

  /**
   * Upload a file and return its public/accessible URL.
   */
  async upload(
    orgId: string,
    key: string,
    body: Buffer,
    contentType: string,
  ): Promise<string> {
    const config = await this.configResolver.getStorageConfig(orgId);
    const { client, bucket, region, endpoint } = await this.getClientAndMeta(
      orgId,
      config,
    );

    const sdk = await this.loadS3SDK();
    const command = new sdk.PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await client.send(command);

    // Build the object URL
    if (endpoint) {
      // R2 or custom S3-compatible endpoint
      return `${endpoint}/${bucket}/${key}`;
    }
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  /**
   * Generate a pre-signed GET URL for a stored object.
   *
   * @param expiresIn Seconds until the URL expires (default: 3600 = 1 hour).
   */
  async getSignedUrl(
    orgId: string,
    key: string,
    expiresIn = 3600,
  ): Promise<string> {
    const config = await this.configResolver.getStorageConfig(orgId);
    const { client, bucket } = await this.getClientAndMeta(orgId, config);

    const sdk = await this.loadS3SDK();
    const presignerModule = await this.loadPresigner();

    const command = new sdk.GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    return presignerModule.getSignedUrl(client as never, command as never, {
      expiresIn,
    });
  }

  /**
   * Delete an object from storage.
   */
  async delete(orgId: string, key: string): Promise<void> {
    const config = await this.configResolver.getStorageConfig(orgId);
    const { client, bucket } = await this.getClientAndMeta(orgId, config);

    const sdk = await this.loadS3SDK();
    const command = new sdk.DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await client.send(command);
  }

  // ─── Dynamic SDK Loaders ────────────────────────────────────────────────

  /**
   * Dynamically import `@aws-sdk/client-s3`.
   * Throws a clear error if the package is not installed.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async loadS3SDK(): Promise<any> {
    try {
      // Dynamic import so the module compiles without the SDK present.
      // At runtime the SDK must be installed:
      //   npm install @aws-sdk/client-s3
      return await (Function(
        'return import("@aws-sdk/client-s3")',
      )() as Promise<unknown>);
    } catch {
      throw new Error(
        'Storage operations require @aws-sdk/client-s3. ' +
          'Install it with: npm install @aws-sdk/client-s3',
      );
    }
  }

  /**
   * Dynamically import `@aws-sdk/s3-request-presigner`.
   * Throws a clear error if the package is not installed.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async loadPresigner(): Promise<any> {
    try {
      // Dynamic import so the module compiles without the SDK present.
      // At runtime the SDK must be installed:
      //   npm install @aws-sdk/s3-request-presigner
      return await (Function(
        'return import("@aws-sdk/s3-request-presigner")',
      )() as Promise<unknown>);
    } catch {
      throw new Error(
        'Signed URL generation requires @aws-sdk/s3-request-presigner. ' +
          'Install it with: npm install @aws-sdk/s3-request-presigner',
      );
    }
  }

  // ─── Private Helpers ────────────────────────────────────────────────────

  private async getClientAndMeta(
    orgId: string,
    config: StorageProviderConfig,
  ): Promise<{
    client: S3ClientLike;
    bucket: string;
    region: string;
    endpoint: string | undefined;
  }> {
    const provider = config.activeProvider;
    const cacheKey = `${orgId}:${provider}`;

    let client = this.clients.get(cacheKey);

    if (provider === 's3' && config.s3) {
      const { accessKey, secretKey, bucket, region } = config.s3;
      if (!client) {
        client = await this.createS3Client({
          accessKeyId: accessKey,
          secretAccessKey: secretKey,
          region,
        });
        this.clients.set(cacheKey, client);
      }
      return { client, bucket, region, endpoint: undefined };
    }

    if (provider === 'r2' && config.r2) {
      const { accessKey, secretKey, bucket, endpoint } = config.r2;
      if (!client) {
        client = await this.createS3Client({
          accessKeyId: accessKey,
          secretAccessKey: secretKey,
          region: 'auto',
          endpoint,
        });
        this.clients.set(cacheKey, client);
      }
      return { client, bucket, region: 'auto', endpoint };
    }

    throw new Error(
      `Unsupported storage provider "${provider}" for org "${orgId}"`,
    );
  }

  private async createS3Client(opts: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    endpoint?: string;
  }): Promise<S3ClientLike> {
    const sdk = await this.loadS3SDK();

    return new sdk.S3Client({
      region: opts.region,
      endpoint: opts.endpoint,
      credentials: {
        accessKeyId: opts.accessKeyId,
        secretAccessKey: opts.secretAccessKey,
      },
      // Required for R2 / path-style S3-compatible endpoints
      forcePathStyle: !!opts.endpoint,
    }) as S3ClientLike;
  }
}
