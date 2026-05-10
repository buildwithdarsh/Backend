import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/index.js';
import type { RequestWithOrg } from '../../common/types/index.js';
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';
import { ReferralsService } from './referrals.service.js';
import { ValidateReferralDto } from './dto/index.js';

@ApiTags('Storefront - Referrals')
@UseGuards(EndUserJwtGuard)
@Controller('api/v1/storefront/referral')
export class StorefrontReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get()
  @ApiOperation({ summary: 'Get my referral code' })
  @ApiResponse({ status: 200, description: 'Referral code' })
  getReferralCode(@Req() req: RequestWithOrg) {
    return this.referralsService.getReferralCode(req.orgId, req.endUser!.id);
  }

  @Public()
  @Post('validate')
  @ApiOperation({ summary: 'Validate a referral code' })
  @ApiResponse({ status: 200, description: 'Referral code is valid' })
  @ApiResponse({ status: 400, description: 'Invalid referral code' })
  validateCode(@Req() req: RequestWithOrg, @Body() dto: ValidateReferralDto) {
    return this.referralsService.validateCode(req.orgId, dto.code, req.endUser?.id ?? '');
  }
}
