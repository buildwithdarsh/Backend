import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetOrg } from '../../common/decorators/index.js';
import { PropertyBookingsService } from './property-bookings.service.js';
import {
  QueryBookingsDto,
  UpdateBookingDto,
  CancelBookingDto,
  AssignUnitsDto,
} from './dto/index.js';

@ApiTags('Admin - Property Bookings')

@Controller('api/v1/property/bookings')
export class AdminBookingsController {
  constructor(private readonly bookingsService: PropertyBookingsService) {}

  @Get()
  @ApiOperation({ summary: 'List all property bookings with filters & pagination' })
  @ApiResponse({ status: 200, description: 'Paginated bookings list' })
  findAll(@GetOrg() orgId: string, @Query() query: QueryBookingsDto) {
    return this.bookingsService.findAll(orgId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking detail' })
  @ApiResponse({ status: 200, description: 'Booking details' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  findOne(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update booking notes/guest details' })
  @ApiResponse({ status: 200, description: 'Booking updated' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  update(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBookingDto,
  ) {
    return this.bookingsService.updateBooking(orgId, id, dto);
  }

  @Post(':id/check-in')
  @ApiOperation({ summary: 'Check in a booking' })
  @ApiResponse({ status: 200, description: 'Booking checked in' })
  @ApiResponse({ status: 400, description: 'Invalid booking status' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  checkIn(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.checkIn(orgId, id);
  }

  @Post(':id/check-out')
  @ApiOperation({ summary: 'Check out a booking' })
  @ApiResponse({ status: 200, description: 'Booking checked out' })
  @ApiResponse({ status: 400, description: 'Invalid booking status' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  checkOut(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.checkOut(orgId, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking' })
  @ApiResponse({ status: 200, description: 'Booking cancelled' })
  @ApiResponse({ status: 400, description: 'Cannot cancel booking' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  cancel(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingsService.cancelBooking(orgId, id, dto.reason);
  }

  @Post(':id/assign-units')
  @ApiOperation({ summary: 'Assign units to a booking' })
  @ApiResponse({ status: 200, description: 'Units assigned' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  assignUnits(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignUnitsDto,
  ) {
    return this.bookingsService.assignUnits(orgId, id, dto.unitIds);
  }
}
