import {
  Controller,
  Get,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/index.js';
import type { RequestWithOrg } from '../../common/types/index.js';
import { PropertyInventoryService } from './property-inventory.service.js';
import { StorefrontAvailabilityDto } from './dto/index.js';

@ApiTags('Storefront - Property Availability')
@Controller('api/v1/storefront/property/availability')
export class StorefrontInventoryController {
  constructor(private readonly inventoryService: PropertyInventoryService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Check property availability (public)' })
  @ApiResponse({ status: 200, description: 'Availability data' })
  checkAvailability(
    @Req() req: RequestWithOrg,
    @Query() dto: StorefrontAvailabilityDto,
  ) {
    if (dto.propertyTypeId) {
      return this.inventoryService.getAvailability(
        req.orgId,
        dto.propertyTypeId,
        dto.startDate,
        dto.endDate,
      );
    }
    return this.inventoryService.getCalendar(req.orgId, dto.startDate, dto.endDate);
  }
}
