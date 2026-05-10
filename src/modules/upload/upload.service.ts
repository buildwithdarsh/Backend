import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import { ConfigResolverService } from '../../services/config-resolver/config-resolver.service.js';
import { CLOUDINARY } from '../../common/constants/providers.js';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(
    private readonly configResolver: ConfigResolverService,
  ) {}

  async uploadToCloudinary(
    orgId: string,
    file: Express.Multer.File,
    subfolder: string = 'uploads',
  ): Promise<{ url: string; publicId: string; width?: number; height?: number }> {
    const config = await this.configResolver.getCloudinaryConfig(orgId);

    if (!config.apiKey || !config.apiSecret) {
      throw new BadRequestException(
        'Cloudinary not configured. Set API credentials in platform config or org config.',
      );
    }

    const folder = config.folder ? `${config.folder}/${subfolder}` : subfolder;
    const timestamp = Math.floor(Date.now() / 1000);

    // Generate signature
    const signatureString = `folder=${folder}&timestamp=${timestamp}${config.apiSecret}`;
    const signature = createHash('sha1').update(signatureString).digest('hex');

    // Upload via Cloudinary Upload API
    const formData = new FormData();
    formData.append(
      'file',
      new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }),
      file.originalname,
    );
    formData.append('api_key', config.apiKey);
    formData.append('timestamp', String(timestamp));
    formData.append('signature', signature);
    formData.append('folder', folder);

    const response = await fetch(CLOUDINARY.UPLOAD(config.cloudName), {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`Cloudinary upload failed: ${text}`);
      throw new BadRequestException('Image upload failed');
    }

    const result = (await response.json()) as {
      secure_url: string;
      public_id: string;
      width: number;
      height: number;
    };

    this.logger.log(`Uploaded to Cloudinary: ${result.public_id}`);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };
  }

  /**
   * Build a Cloudinary delivery URL from a stored public_id/path.
   * This is a server-side equivalent of the frontend cloudinaryUrl() helper.
   */
  buildUrl(
    publicId: string,
    cloudName: string = 'dakd6siup',
    transforms: string = 'f_auto,q_auto',
  ): string {
    if (!publicId) return '';
    if (publicId.startsWith('http')) return publicId;
    return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms}/${publicId}`;
  }
}
