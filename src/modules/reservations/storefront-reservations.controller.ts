import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/index.js';
import type { RequestWithOrg } from '../../common/types/index.js';
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';
import { ReservationsService } from './reservations.service.js';
import {
  CreateReservationDto,
  CheckAvailabilityDto,
  QueryReservationsDto,
} from './dto/index.js';

@ApiTags('Storefront - Reservations')
@UseGuards(EndUserJwtGuard)
@Controller('api/v1/storefront/reservations')
export class StorefrontReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Public()
  @Get('availability')
  @ApiOperation({ summary: 'Check reservation availability for a date' })
  @ApiResponse({ status: 200, description: 'Available slots and resources' })
  checkAvailability(@Req() req: RequestWithOrg, @Query() dto: CheckAvailabilityDto) {
    return this.reservationsService.checkAvailability(
      req.orgId,
      dto.date,
      dto.partySize,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a new reservation' })
  @ApiResponse({ status: 201, description: 'Reservation created' })
  @ApiResponse({ status: 400, description: 'Slot fully booked' })
  create(@Req() req: RequestWithOrg, @Body() dto: CreateReservationDto) {
    return this.reservationsService.create(req.orgId, req.endUser!.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List my reservations' })
  @ApiResponse({ status: 200, description: 'Paginated reservations' })
  findMine(@Req() req: RequestWithOrg, @Query() query: QueryReservationsDto) {
    return this.reservationsService.findByEndUser(req.orgId, req.endUser!.id, query);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancel a reservation' })
  @ApiResponse({ status: 200, description: 'Reservation cancelled' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  async cancel(@Req() req: RequestWithOrg, @Param('id') id: string) {
    await this.reservationsService.updateStatus(req.orgId, id, 'cancelled', req.endUser!.id);
    return { message: 'Reservation cancelled' };
  }
}
