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
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetOrg } from '../../common/decorators/index.js';
import { PropertyService } from './property.service.js';
import {
  CreatePropertyTypeDto,
  UpdatePropertyTypeDto,
  CreatePropertyUnitDto,
  UpdatePropertyUnitDto,
  CreateAmenityDto,
  UpdateHousekeepingDto,
  ManageAmenitiesDto,
} from './dto/index.js';

@ApiTags('Admin - Property')

@Controller('api/v1/property')
export class AdminPropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  // ─── Property Types ────────────────────────────────────────────────────────

  @Get('types')
  @ApiOperation({ summary: 'List all property types' })
  @ApiResponse({ status: 200, description: 'All property types' })
  findAllTypes(@GetOrg() orgId: string) {
    return this.propertyService.findAllTypes(orgId);
  }

  @Get('types/:id')
  @ApiOperation({ summary: 'Get a property type by ID' })
  @ApiResponse({ status: 200, description: 'Property type details' })
  @ApiResponse({ status: 404, description: 'Property type not found' })
  findOneType(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.propertyService.findOneType(orgId, id);
  }

  @Post('types')
  @ApiOperation({ summary: 'Create a property type' })
  @ApiResponse({ status: 201, description: 'Property type created' })
  createType(@GetOrg() orgId: string, @Body() dto: CreatePropertyTypeDto) {
    return this.propertyService.createType(orgId, dto);
  }

  @Patch('types/:id')
  @ApiOperation({ summary: 'Update a property type' })
  @ApiResponse({ status: 200, description: 'Property type updated' })
  @ApiResponse({ status: 404, description: 'Property type not found' })
  updateType(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePropertyTypeDto,
  ) {
    return this.propertyService.updateType(orgId, id, dto);
  }

  @Delete('types/:id')
  @ApiOperation({ summary: 'Soft-delete a property type' })
  @ApiResponse({ status: 200, description: 'Property type deleted' })
  @ApiResponse({ status: 404, description: 'Property type not found' })
  removeType(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.propertyService.removeType(orgId, id);
  }

  @Put('types/:id/amenities')
  @ApiOperation({ summary: 'Set amenities for a property type' })
  @ApiResponse({ status: 200, description: 'Amenities updated' })
  setAmenities(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ManageAmenitiesDto,
  ) {
    return this.propertyService.setAmenities(orgId, id, dto.amenityIds);
  }

  // ─── Property Units ────────────────────────────────────────────────────────

  @Get('units')
  @ApiOperation({ summary: 'List all property units' })
  @ApiResponse({ status: 200, description: 'All property units' })
  findAllUnits(
    @GetOrg() orgId: string,
    @Query('propertyTypeId') propertyTypeId?: string,
  ) {
    return this.propertyService.findAllUnits(orgId, propertyTypeId);
  }

  @Post('units')
  @ApiOperation({ summary: 'Create a property unit' })
  @ApiResponse({ status: 201, description: 'Property unit created' })
  createUnit(@GetOrg() orgId: string, @Body() dto: CreatePropertyUnitDto) {
    return this.propertyService.createUnit(orgId, dto);
  }

  @Patch('units/:id')
  @ApiOperation({ summary: 'Update a property unit' })
  @ApiResponse({ status: 200, description: 'Property unit updated' })
  @ApiResponse({ status: 404, description: 'Property unit not found' })
  updateUnit(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePropertyUnitDto,
  ) {
    return this.propertyService.updateUnit(orgId, id, dto);
  }

  @Patch('units/:id/housekeeping')
  @ApiOperation({ summary: 'Update housekeeping status of a unit' })
  @ApiResponse({ status: 200, description: 'Housekeeping status updated' })
  @ApiResponse({ status: 404, description: 'Property unit not found' })
  updateHousekeeping(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHousekeepingDto,
  ) {
    return this.propertyService.updateHousekeeping(orgId, id, dto.status);
  }

  // ─── Amenities ─────────────────────────────────────────────────────────────

  @Get('amenities')
  @ApiOperation({ summary: 'List all amenities' })
  @ApiResponse({ status: 200, description: 'All amenities' })
  findAllAmenities(@GetOrg() orgId: string) {
    return this.propertyService.findAllAmenities(orgId);
  }

  @Post('amenities')
  @ApiOperation({ summary: 'Create an amenity' })
  @ApiResponse({ status: 201, description: 'Amenity created' })
  createAmenity(@GetOrg() orgId: string, @Body() dto: CreateAmenityDto) {
    return this.propertyService.createAmenity(orgId, dto);
  }
}
