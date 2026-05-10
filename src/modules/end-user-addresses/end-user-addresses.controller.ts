import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RequestWithOrg } from '../../common/types/index.js';
import { EndUserAddressesService } from './end-user-addresses.service.js';
import { CreateAddressDto, UpdateAddressDto } from './dto/index.js';

// Import the EndUserJwtGuard
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';

@ApiTags('Storefront Addresses')
@UseGuards(EndUserJwtGuard)
@Controller('api/v1/storefront/addresses')
export class EndUserAddressesController {
  constructor(private readonly addressesService: EndUserAddressesService) {}

  @Get()
  @ApiOperation({ summary: 'List all addresses' })
  async findAll(@Req() req: RequestWithOrg) {
    return this.addressesService.findAll(req.orgId, req.endUser!.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single address' })
  async findOne(@Req() req: RequestWithOrg, @Param('id') id: string) {
    return this.addressesService.findOne(req.orgId, req.endUser!.id, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new address' })
  async create(@Req() req: RequestWithOrg, @Body() dto: CreateAddressDto) {
    return this.addressesService.create(req.orgId, req.endUser!.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an address' })
  async update(
    @Req() req: RequestWithOrg,
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addressesService.update(req.orgId, req.endUser!.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an address' })
  async remove(@Req() req: RequestWithOrg, @Param('id') id: string) {
    await this.addressesService.remove(req.orgId, req.endUser!.id, id);
  }
}
