import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrgConfigService } from './org-config.service.js';
import { UpdateOrgConfigDto } from './dto/update-org-config.dto.js';
import { UpdatePlatformConfigDto } from './dto/update-platform-config.dto.js';
import { SuperAdminGuard } from '../../common/guards/index.js';

// ─── Per-Org Config (Super Admin) ────────────────────────────────────────────

@ApiTags('Admin - Org Config')
@UseGuards(SuperAdminGuard)
@Controller('api/v1/admin/orgs/:id/config')
export class AdminOrgConfigController {
  constructor(private readonly orgConfigService: OrgConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Get organization config (masked secrets)' })
  @ApiResponse({ status: 200, description: 'Org config with masked secrets' })
  @ApiResponse({ status: 404, description: 'Config not found' })
  getOrgConfig(@Param('id', ParseUUIDPipe) orgId: string) {
    return this.orgConfigService.getOrgConfig(orgId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update organization config' })
  @ApiResponse({ status: 200, description: 'Config updated (masked)' })
  @ApiResponse({ status: 404, description: 'Config not found' })
  updateOrgConfig(
    @Param('id', ParseUUIDPipe) orgId: string,
    @Body() dto: UpdateOrgConfigDto,
  ) {
    return this.orgConfigService.updateOrgConfig(orgId, dto);
  }

  @Post('test/:group')
  @ApiOperation({ summary: 'Test provider connectivity for a group' })
  @ApiResponse({ status: 200, description: 'Test result' })
  @ApiResponse({ status: 404, description: 'Unknown group' })
  testProvider(
    @Param('id', ParseUUIDPipe) orgId: string,
    @Param('group') group: string,
  ) {
    return this.orgConfigService.testProvider(orgId, group);
  }

  @Post('reset/:group')
  @ApiOperation({ summary: 'Reset provider group to platform defaults' })
  @ApiResponse({ status: 200, description: 'Group reset' })
  @ApiResponse({ status: 404, description: 'Unknown group or config not found' })
  resetGroup(
    @Param('id', ParseUUIDPipe) orgId: string,
    @Param('group') group: string,
  ) {
    return this.orgConfigService.resetGroup(orgId, group);
  }
}

// ─── Platform Config (Super Admin) ───────────────────────────────────────────

@ApiTags('Admin - Platform Config')
@UseGuards(SuperAdminGuard)
@Controller('api/v1/admin/platform-config')
export class AdminPlatformConfigController {
  constructor(private readonly orgConfigService: OrgConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Get all platform config entries (masked)' })
  @ApiResponse({ status: 200, description: 'Platform config list' })
  getPlatformConfig() {
    return this.orgConfigService.getPlatformConfig();
  }

  @Patch()
  @ApiOperation({ summary: 'Upsert a platform config entry' })
  @ApiResponse({ status: 200, description: 'Config entry upserted (masked)' })
  updatePlatformConfig(@Body() dto: UpdatePlatformConfigDto) {
    return this.orgConfigService.updatePlatformConfig(dto);
  }

  @Post('test/:group')
  @ApiOperation({ summary: 'Test platform provider connectivity for a group' })
  @ApiResponse({ status: 200, description: 'Test result' })
  @ApiResponse({ status: 404, description: 'Unknown group' })
  testPlatformConfig(@Param('group') group: string) {
    return this.orgConfigService.testPlatformConfig(group);
  }
}
