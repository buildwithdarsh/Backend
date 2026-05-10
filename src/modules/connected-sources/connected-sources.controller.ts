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
import { ConnectedSourcesService } from './connected-sources.service.js';

@ApiTags('Storefront - Connected Sources')
@Controller('api/v1/storefront/connected-sources')
@UseGuards(EndUserJwtGuard)
export class ConnectedSourcesController {
  constructor(private readonly connectedSourcesService: ConnectedSourcesService) {}

  @Get()
  @ApiOperation({ summary: 'List all connected sources for the current user' })
  async listSources(
    @GetOrg() orgId: string,
    @GetEndUser('id') endUserId: string,
  ) {
    const sources = await this.connectedSourcesService.getConnectedSources(orgId, endUserId);
    return { sources };
  }

  @Get('google-drive/connect')
  @ApiOperation({ summary: 'Get Google OAuth URL for connecting Google Drive' })
  async getGoogleDriveConnectUrl() {
    const url = this.connectedSourcesService.getGoogleOAuthUrl();
    return { url };
  }

  @Post('google-drive/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange Google OAuth code and connect Google Drive' })
  async googleDriveCallback(
    @GetOrg() orgId: string,
    @GetEndUser('id') endUserId: string,
    @Body() body: { code: string },
  ) {
    const source = await this.connectedSourcesService.connectGoogleDrive(
      orgId,
      endUserId,
      body.code,
    );
    return { source };
  }

  @Delete(':provider')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disconnect a source' })
  async disconnectSource(
    @GetOrg() orgId: string,
    @GetEndUser('id') endUserId: string,
    @Param('provider') provider: string,
  ) {
    return this.connectedSourcesService.disconnectSource(orgId, endUserId, provider);
  }
}
