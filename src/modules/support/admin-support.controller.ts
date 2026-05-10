import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetOrg } from '../../common/decorators/index.js';
import { SupportService } from './support.service.js';
import { UpdateTicketDto, QueryTicketsDto } from './dto/index.js';

@ApiTags('Admin - Support')

@Controller('api/v1/support')
export class AdminSupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get()
  @ApiOperation({ summary: 'List all support tickets with filters & pagination' })
  @ApiResponse({ status: 200, description: 'Paginated support tickets' })
  findAll(@GetOrg() orgId: string, @Query() query: QueryTicketsDto) {
    return this.supportService.findAll(orgId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single support ticket' })
  @ApiResponse({ status: 200, description: 'Ticket details' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  findOne(@GetOrg() orgId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.supportService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update ticket status, priority, category, or assignment' })
  @ApiResponse({ status: 200, description: 'Ticket updated' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  update(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.supportService.update(orgId, id, dto);
  }
}
