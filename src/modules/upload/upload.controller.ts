import {
  Controller,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';
import type { RequestWithOrg } from '../../common/types/index.js';
import { UploadService } from './upload.service.js';

// ─── Storefront upload (EndUser) ─────────────────────────────────────────────

@ApiTags('Upload')
@ApiBearerAuth()
@UseGuards(EndUserJwtGuard)
@Controller('api/v1/storefront/upload')
export class StorefrontUploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithOrg,
  ) {
    if (!file) throw new BadRequestException('No file provided');

    const subfolder = (req.query?.['folder'] as string) || 'uploads';
    return this.uploadService.uploadToCloudinary(req.orgId, file, subfolder);
  }
}

// ─── Admin upload ────────────────────────────────────────────────────────────

@ApiTags('Upload')
@ApiBearerAuth()

@Controller('api/v1/upload')
export class AdminUploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithOrg,
  ) {
    if (!file) throw new BadRequestException('No file provided');

    const subfolder = (req.query?.['folder'] as string) || 'uploads';
    return this.uploadService.uploadToCloudinary(req.orgId, file, subfolder);
  }
}
