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
import type { RequestWithOrg } from '../../common/types/index.js';
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';
import { SupportService } from './support.service.js';
import { CreateTicketDto, CreateTicketReplyDto, QueryTicketsDto } from './dto/index.js';

@ApiTags('Storefront - Support')
@UseGuards(EndUserJwtGuard)
@Controller('api/v1/storefront/support')
export class StorefrontSupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new support ticket' })
  @ApiResponse({ status: 201, description: 'Ticket created' })
  create(@Req() req: RequestWithOrg, @Body() dto: CreateTicketDto) {
    return this.supportService.create(req.orgId, req.endUser!.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List my support tickets' })
  @ApiResponse({ status: 200, description: 'Paginated support tickets' })
  findMine(@Req() req: RequestWithOrg, @Query() query: QueryTicketsDto) {
    return this.supportService.findByEndUser(req.orgId, req.endUser!.id, query);
  }

  @Post(':ticketId/reply')
  @ApiOperation({ summary: 'Reply to a support ticket' })
  @ApiResponse({ status: 201, description: 'Reply added to ticket' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  reply(
    @Req() req: RequestWithOrg,
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
    @Body() dto: CreateTicketReplyDto,
  ) {
    return this.supportService.addReply(
      req.orgId,
      ticketId,
      req.endUser!.id,
      'enduser',
      dto.body,
    );
  }
}
