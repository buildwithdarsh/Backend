import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';
import { QueryOrganizationDto } from './dto/query-organization.dto.js';
import { GetOrg } from '../../common/decorators/index.js';
import { SuperAdminGuard } from '../../common/guards/index.js';

// ─── Super Admin Routes ──────────────────────────────────────────────────────

@ApiTags('Admin - Organizations')
@UseGuards(SuperAdminGuard)
@Controller('api/v1/admin/orgs')
export class AdminOrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiResponse({ status: 201, description: 'Organization created' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  create(@Body() dto: CreateOrganizationDto) {
    return this.organizationsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all organizations (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated organization list' })
  findAll(@Query() dto: QueryOrganizationDto) {
    return this.organizationsService.findAll(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  @ApiResponse({ status: 200, description: 'Organization details' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get organization by slug' })
  @ApiResponse({ status: 200, description: 'Organization details' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.organizationsService.findBySlug(slug);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization' })
  @ApiResponse({ status: 200, description: 'Organization updated' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete organization' })
  @ApiResponse({ status: 200, description: 'Organization deleted' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.remove(id);
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: 'Suspend organization' })
  @ApiResponse({ status: 200, description: 'Organization suspended' })
  @ApiResponse({ status: 409, description: 'Already suspended' })
  suspend(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.suspend(id);
  }

  @Post(':id/reinstate')
  @ApiOperation({ summary: 'Reinstate suspended organization' })
  @ApiResponse({ status: 200, description: 'Organization reinstated' })
  @ApiResponse({ status: 409, description: 'Not suspended' })
  reinstate(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.reinstate(id);
  }

  @Post(':id/regenerate-key')
  @ApiOperation({ summary: 'Regenerate storefront API key for an organization' })
  @ApiResponse({ status: 200, description: 'New storefront key returned' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  regenerateKey(@Param('id', ParseUUIDPipe) id: string) {
    return this.organizationsService.regenerateStorefrontKey(id);
  }
}

// ─── Org Admin Self-Management Routes ────────────────────────────────────────

@ApiTags('Organization - Self')
@Controller('api/v1/org/me')
export class OrgSelfController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get my organization details' })
  @ApiResponse({ status: 200, description: 'Organization details' })
  getMyOrg(@GetOrg() orgId: string) {
    return this.organizationsService.getMyOrg(orgId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update my organization' })
  @ApiResponse({ status: 200, description: 'Organization updated' })
  updateMyOrg(
    @GetOrg() orgId: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(orgId, dto);
  }
}
