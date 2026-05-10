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
import { PropertyService } from './property.service.js';

@ApiTags('Storefront - Property')
@Controller('api/v1/storefront/property')
export class StorefrontPropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Public()
  @Get('types')
  @ApiOperation({ summary: 'List active property types with amenities' })
  @ApiResponse({ status: 200, description: 'Active property types' })
  findAllTypes(@Req() req: RequestWithOrg) {
    return this.propertyService.findAllTypes(req.orgId, true);
  }

  @Public()
  @Get('types/:id')
  @ApiOperation({ summary: 'Get property type detail' })
  @ApiResponse({ status: 200, description: 'Property type details' })
  @ApiResponse({ status: 404, description: 'Property type not found' })
  findOneType(@Req() req: RequestWithOrg, @Param('id', ParseUUIDPipe) id: string) {
    return this.propertyService.findOneType(req.orgId, id);
  }
}
