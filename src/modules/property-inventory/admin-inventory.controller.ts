import {
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetOrg } from '../../common/decorators/index.js';
import { PropertyInventoryService } from './property-inventory.service.js';
import {
  CheckAvailabilityDto,
  CalendarQueryDto,
  BlockDatesDto,
  CreateHoldDto,
} from './dto/index.js';

@ApiTags('Admin - Property Inventory')

@Controller('api/v1/property/inventory')
export class AdminInventoryController {
  constructor(private readonly inventoryService: PropertyInventoryService) {}

  @Get('availability')
  @ApiOperation({ summary: 'Get availability for a property type over a date range' })
  @ApiResponse({ status: 200, description: 'Daily inventory breakdown' })
  getAvailability(@GetOrg() orgId: string, @Query() dto: CheckAvailabilityDto) {
    return this.inventoryService.getAvailability(
      orgId,
      dto.propertyTypeId,
      dto.startDate,
      dto.endDate,
    );
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get calendar view across all property types' })
  @ApiResponse({ status: 200, description: 'Calendar grouped by property type' })
  getCalendar(@GetOrg() orgId: string, @Query() dto: CalendarQueryDto) {
    return this.inventoryService.getCalendar(orgId, dto.startDate, dto.endDate);
  }

  @Post('block')
  @ApiOperation({ summary: 'Block dates for a property type' })
  @ApiResponse({ status: 200, description: 'Dates blocked' })
  blockDates(@GetOrg() orgId: string, @Body() dto: BlockDatesDto) {
    return this.inventoryService.blockDates(
      orgId,
      dto.propertyTypeId,
      dto.dates,
      dto.reason,
    );
  }

  @Post('hold')
  @ApiOperation({ summary: 'Create a temporary inventory hold' })
  @ApiResponse({ status: 201, description: 'Hold created' })
  @ApiResponse({ status: 400, description: 'Insufficient availability' })
  createHold(@GetOrg() orgId: string, @Body() dto: CreateHoldDto) {
    return this.inventoryService.createHold(
      orgId,
      dto.propertyTypeId,
      dto.startDate,
      dto.endDate,
      dto.units,
    );
  }
}
