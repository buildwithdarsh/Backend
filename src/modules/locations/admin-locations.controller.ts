import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetOrg } from '../../common/decorators/index.js';
import { LocationsService } from './locations.service.js';
import {
  CreateLocationDto,
  UpdateLocationDto,
  SetHoursDto,
  CreateDeliveryZoneDto,
  UpdateDeliveryZoneDto,
} from './dto/index.js';

@ApiTags('Admin - Locations')

@Controller('api/v1/locations')
export class AdminLocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  // ─── Locations CRUD ─────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List all store locations' })
  @ApiResponse({ status: 200, description: 'All active locations' })
  findAll(@GetOrg() orgId: string) {
    return this.locationsService.findAll(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single store location with hours and zones' })
  @ApiResponse({ status: 200, description: 'Location details' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  findOne(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.locationsService.findOne(orgId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a store location' })
  @ApiResponse({ status: 201, description: 'Location created' })
  create(@GetOrg() orgId: string, @Body() dto: CreateLocationDto) {
    return this.locationsService.create(orgId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a store location' })
  @ApiResponse({ status: 200, description: 'Location updated' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  update(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.locationsService.update(orgId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a store location' })
  @ApiResponse({ status: 200, description: 'Location deleted' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  remove(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.locationsService.remove(orgId, id);
  }

  // ─── Store Hours ────────────────────────────────────────────────────────────

  @Put(':id/hours')
  @ApiOperation({ summary: 'Set store hours for a location (upserts all days)' })
  @ApiResponse({ status: 200, description: 'Store hours updated' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  setHours(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) locationId: string,
    @Body() dto: SetHoursDto,
  ) {
    return this.locationsService.setHours(orgId, locationId, dto);
  }

  // ─── Delivery Zones ─────────────────────────────────────────────────────────

  @Get(':id/delivery-zones')
  @ApiOperation({ summary: 'List delivery zones for a location' })
  @ApiResponse({ status: 200, description: 'Delivery zones list' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  findAllDeliveryZones(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) locationId: string,
  ) {
    return this.locationsService.findAllDeliveryZones(orgId, locationId);
  }

  @Post(':id/delivery-zones')
  @ApiOperation({ summary: 'Create a delivery zone for a location' })
  @ApiResponse({ status: 201, description: 'Delivery zone created' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  createDeliveryZone(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) locationId: string,
    @Body() dto: CreateDeliveryZoneDto,
  ) {
    return this.locationsService.createDeliveryZone(orgId, locationId, dto);
  }

  @Patch('delivery-zones/:zoneId')
  @ApiOperation({ summary: 'Update a delivery zone' })
  @ApiResponse({ status: 200, description: 'Delivery zone updated' })
  @ApiResponse({ status: 404, description: 'Delivery zone not found' })
  updateDeliveryZone(
    @GetOrg() orgId: string,
    @Param('zoneId', ParseUUIDPipe) zoneId: string,
    @Body() dto: UpdateDeliveryZoneDto,
  ) {
    return this.locationsService.updateDeliveryZone(orgId, zoneId, dto);
  }

  @Delete('delivery-zones/:zoneId')
  @ApiOperation({ summary: 'Delete a delivery zone' })
  @ApiResponse({ status: 200, description: 'Delivery zone deleted' })
  @ApiResponse({ status: 404, description: 'Delivery zone not found' })
  removeDeliveryZone(
    @GetOrg() orgId: string,
    @Param('zoneId', ParseUUIDPipe) zoneId: string,
  ) {
    return this.locationsService.removeDeliveryZone(orgId, zoneId);
  }
}
