import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/index.js';
import type { RequestWithOrg } from '../../common/types/index.js';
import { LocationsService } from './locations.service.js';

@ApiTags('Storefront - Locations')
@Controller('api/v1/storefront/locations')
export class StorefrontLocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List active store locations with hours' })
  @ApiResponse({ status: 200, description: 'Active locations list' })
  findAll(@Req() req: RequestWithOrg) {
    return this.locationsService.findAll(req.orgId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single store location with hours and delivery zones' })
  @ApiResponse({ status: 200, description: 'Location details' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  findOne(@Req() req: RequestWithOrg, @Param('id', ParseUUIDPipe) id: string) {
    return this.locationsService.findOne(req.orgId, id);
  }
}
