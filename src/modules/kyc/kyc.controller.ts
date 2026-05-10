import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RequestWithOrg } from '../../common/types/index.js';
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';
import { KycService } from './kyc.service.js';
import type { SubmitKycDto } from './dto/kyc.dto.js';

@ApiTags('Storefront - KYC')
@Controller('api/v1/storefront/banking/kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post()
  @UseGuards(EndUserJwtGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit KYC document for verification' })
  async submit(
    @Req() req: RequestWithOrg,
    @Body() body: SubmitKycDto,
  ) {
    return this.kycService.submit(req.orgId, req.endUser!.id, body);
  }

  @Get('status')
  @UseGuards(EndUserJwtGuard)
  @ApiOperation({ summary: 'Get KYC verification status for current user' })
  async getStatus(@Req() req: RequestWithOrg) {
    return this.kycService.getStatus(req.orgId, req.endUser!.id);
  }
}
