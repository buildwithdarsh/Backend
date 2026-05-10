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
import { ReservationsService } from './reservations.service.js';
import {
  QueryReservationsDto,
  UpdateReservationStatusDto,
  CreateResourceDto,
  UpdateResourceDto,
} from './dto/index.js';

@ApiTags('Admin - Reservations')

@Controller('api/v1/reservations')
export class AdminReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  // ─── Reservations ────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List all reservations with filters & pagination' })
  @ApiResponse({ status: 200, description: 'Paginated reservations list' })
  findAll(@GetOrg() orgId: string, @Query() query: QueryReservationsDto) {
    return this.reservationsService.findAll(orgId, query);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update reservation status' })
  @ApiResponse({ status: 200, description: 'Reservation status updated' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  updateStatus(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReservationStatusDto,
  ) {
    return this.reservationsService.updateStatus(orgId, id, dto.status);
  }

  // ─── Resources ──────────────────────────────────────────────────────────

  @Get('resources')
  @ApiOperation({ summary: 'List all bookable resources' })
  @ApiResponse({ status: 200, description: 'All resources' })
  findAllResources(@GetOrg() orgId: string) {
    return this.reservationsService.findAllResources(orgId);
  }

  @Post('resources')
  @ApiOperation({ summary: 'Create a bookable resource' })
  @ApiResponse({ status: 201, description: 'Resource created' })
  createResource(@GetOrg() orgId: string, @Body() dto: CreateResourceDto) {
    return this.reservationsService.createResource(orgId, dto);
  }

  @Patch('resources/:id')
  @ApiOperation({ summary: 'Update a bookable resource' })
  @ApiResponse({ status: 200, description: 'Resource updated' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  updateResource(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateResourceDto,
  ) {
    return this.reservationsService.updateResource(orgId, id, dto);
  }

  @Delete('resources/:id')
  @ApiOperation({ summary: 'Delete a bookable resource' })
  @ApiResponse({ status: 200, description: 'Resource deleted' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  removeResource(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.reservationsService.removeResource(orgId, id);
  }
}
