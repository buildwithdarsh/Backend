import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/index.js';
import type { RequestWithOrg } from '../../common/types/index.js';
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';
import { PropertyBookingsService } from './property-bookings.service.js';
import {
  CreateBookingDto,
  QueryBookingsDto,
  CancelBookingDto,
  CreatePaymentOrderDto,
  VerifyPaymentDto,
} from './dto/index.js';

@ApiTags('Storefront - Property Bookings')
@UseGuards(EndUserJwtGuard)
@Controller('api/v1/storefront/property/bookings')
export class StorefrontBookingsController {
  constructor(private readonly bookingsService: PropertyBookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new property booking' })
  @ApiResponse({ status: 201, description: 'Booking created' })
  @ApiResponse({ status: 400, description: 'Invalid dates or no availability' })
  create(@Req() req: RequestWithOrg, @Body() dto: CreateBookingDto) {
    return this.bookingsService.createBooking(req.orgId, req.endUser!.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List my bookings' })
  @ApiResponse({ status: 200, description: 'Paginated bookings' })
  findMine(@Req() req: RequestWithOrg, @Query() query: QueryBookingsDto) {
    return this.bookingsService.findByEndUser(req.orgId, req.endUser!.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get my booking detail' })
  @ApiResponse({ status: 200, description: 'Booking details' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  findOne(@Req() req: RequestWithOrg, @Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.findOne(req.orgId, id, req.endUser!.id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel my booking' })
  @ApiResponse({ status: 200, description: 'Booking cancelled' })
  @ApiResponse({ status: 400, description: 'Cannot cancel booking' })
  cancel(
    @Req() req: RequestWithOrg,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingsService.cancelBooking(req.orgId, id, dto.reason, req.endUser!.id);
  }

  @Post(':id/payment-order')
  @ApiOperation({ summary: 'Create payment order for booking' })
  @ApiResponse({ status: 201, description: 'Payment order created' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  createPaymentOrder(
    @Req() req: RequestWithOrg,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePaymentOrderDto,
  ) {
    return this.bookingsService.createPaymentOrder(req.orgId, id, dto.paymentType, req.endUser!.id);
  }

  @Post('verify-payment')
  @ApiOperation({ summary: 'Verify and confirm payment' })
  @ApiResponse({ status: 200, description: 'Payment verified' })
  verifyPayment(@Req() req: RequestWithOrg, @Body() dto: VerifyPaymentDto) {
    return this.bookingsService.verifyPayment(req.orgId, dto);
  }

  @Public()
  @Get('lookup')
  @ApiOperation({ summary: 'Lookup booking by reference' })
  @ApiResponse({ status: 200, description: 'Booking found' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  lookup(@Req() req: RequestWithOrg, @Query('reference') reference: string) {
    return this.bookingsService.lookupByReference(req.orgId, reference);
  }
}
