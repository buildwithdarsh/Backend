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
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetOrg } from '../../common/decorators/index.js';
import { SuppliersService } from './suppliers.service.js';
import {
  QuerySuppliersDto,
  CreateSupplierDto,
  UpdateSupplierDto,
} from './dto/index.js';

@ApiTags('Admin - Suppliers')
@Controller('api/v1/suppliers')
export class AdminSuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @ApiOperation({ summary: 'List all suppliers (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated list of suppliers' })
  findAll(@GetOrg() orgId: string, @Query() query: QuerySuppliersDto) {
    return this.suppliersService.findAll(orgId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single supplier' })
  @ApiResponse({ status: 200, description: 'Supplier details' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  findOne(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.suppliersService.findOne(orgId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a supplier' })
  @ApiResponse({ status: 201, description: 'Supplier created' })
  create(@GetOrg() orgId: string, @Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(orgId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a supplier' })
  @ApiResponse({ status: 200, description: 'Supplier updated' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  update(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(orgId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a supplier' })
  @ApiResponse({ status: 200, description: 'Supplier deleted' })
  @ApiResponse({ status: 404, description: 'Supplier not found' })
  remove(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.suppliersService.remove(orgId, id);
  }
}
