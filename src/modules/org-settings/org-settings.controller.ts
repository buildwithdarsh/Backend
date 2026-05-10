import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/index.js';
import { GetOrg } from '../../common/decorators/index.js';
import type { RequestWithOrg } from '../../common/types/index.js';
import { OrgSettingsService } from './org-settings.service.js';
import { UpdateSettingDto, BulkUpdateSettingsDto } from './dto/index.js';

@ApiTags('Settings')
@Controller('api/v1')
export class OrgSettingsController {
  constructor(private readonly settingsService: OrgSettingsService) {}

  // ─── Admin Routes ──────────────────────────────────────────────────────────

  @Get('settings')
  // Auth handled by global JwtAuthGuard
  @ApiOperation({ summary: 'Get all org settings (admin)' })
  async getAll(@GetOrg() orgId: string) {
    return this.settingsService.getAll(orgId);
  }

  @Get('settings/:group')
  // Auth handled by global JwtAuthGuard
  @ApiOperation({ summary: 'Get settings by group (admin)' })
  async getByGroup(@GetOrg() orgId: string, @Param('group') group: string) {
    return this.settingsService.getByGroup(orgId, group);
  }

  @Put('settings/:group/:key')
  // Auth handled by global JwtAuthGuard
  @ApiOperation({ summary: 'Set a single setting (admin)' })
  async set(
    @GetOrg() orgId: string,
    @Param('group') group: string,
    @Param('key') key: string,
    @Body() dto: UpdateSettingDto,
  ) {
    return this.settingsService.set(orgId, group, key, dto.value, dto.type, dto.label);
  }

  @Put('settings')
  // Auth handled by global JwtAuthGuard
  @ApiOperation({ summary: 'Bulk update settings (admin)' })
  async bulkSet(@GetOrg() orgId: string, @Body() dto: BulkUpdateSettingsDto) {
    return this.settingsService.bulkSet(orgId, dto.settings);
  }

  @Delete('settings/:group/:key')
  // Auth handled by global JwtAuthGuard
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a setting (admin)' })
  async delete(
    @GetOrg() orgId: string,
    @Param('group') group: string,
    @Param('key') key: string,
  ) {
    await this.settingsService.delete(orgId, group, key);
  }

  // ─── Storefront Route ──────────────────────────────────────────────────────

  @Public()
  @Get('storefront/config')
  @ApiOperation({ summary: 'Get public config for storefront' })
  async getPublicConfig(@Req() req: RequestWithOrg) {
    return this.settingsService.getPublicConfig(req.orgId);
  }
}
