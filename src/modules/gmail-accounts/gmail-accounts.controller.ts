import {
  Controller,
  Delete,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetOrg, GetEndUser } from '../../common/decorators/index.js';
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';
import { GmailAccountsService } from './gmail-accounts.service.js';
import { GmailCallbackDto } from './dto/index.js';

@ApiTags('Storefront - Gmail Accounts')
@Controller('api/v1/storefront/gmail-accounts')
@UseGuards(EndUserJwtGuard)
export class GmailAccountsController {
  constructor(private readonly gmailAccountsService: GmailAccountsService) {}

  @Get()
  @ApiOperation({ summary: 'List connected Gmail accounts' })
  async list(
    @GetOrg() orgId: string,
    @GetEndUser('id') endUserId: string,
  ) {
    const accounts = await this.gmailAccountsService.list(orgId, endUserId);
    return { accounts };
  }

  @Get('connect')
  @ApiOperation({ summary: 'Get Google OAuth URL to connect a Gmail account' })
  async getConnectUrl() {
    const url = this.gmailAccountsService.getConnectUrl();
    return { url };
  }

  @Post('callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange OAuth code and connect Gmail account' })
  async callback(
    @GetOrg() orgId: string,
    @GetEndUser('id') endUserId: string,
    @Body() body: GmailCallbackDto,
  ) {
    const account = await this.gmailAccountsService.connect(orgId, endUserId, body.code);
    return { account };
  }

  @Post(':id/scan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger a Gmail scan for a connected account' })
  async triggerScan(
    @GetOrg() orgId: string,
    @GetEndUser('id') endUserId: string,
    @Param('id') accountId: string,
  ) {
    return this.gmailAccountsService.triggerScan(orgId, endUserId, accountId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disconnect a Gmail account' })
  async disconnect(
    @GetOrg() orgId: string,
    @GetEndUser('id') endUserId: string,
    @Param('id') accountId: string,
  ) {
    return this.gmailAccountsService.disconnect(orgId, endUserId, accountId);
  }
}
