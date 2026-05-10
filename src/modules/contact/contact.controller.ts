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
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/index.js';
import { GetOrg } from '../../common/decorators/index.js';
import type { RequestWithOrg } from '../../common/types/index.js';
import { ContactService } from './contact.service.js';
import { CreateContactDto, QueryContactsDto, SubscribeDto } from './dto/index.js';

@ApiTags('Storefront - Contact')
@Controller('api/v1/storefront/contact')
export class StorefrontContactController {
  constructor(private readonly contactService: ContactService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Submit a contact message' })
  @ApiResponse({ status: 201, description: 'Contact message submitted' })
  create(@Req() req: RequestWithOrg, @Body() dto: CreateContactDto) {
    return this.contactService.create(req.orgId, dto);
  }

  @Public()
  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to newsletter' })
  @ApiResponse({ status: 201, description: 'Subscribed successfully' })
  subscribe(@Req() req: RequestWithOrg, @Body() dto: SubscribeDto) {
    return this.contactService.subscribe(req.orgId, dto);
  }
}

@ApiTags('Contact Messages')
@Controller('api/v1/contact-messages')
export class ContactMessagesController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  @ApiOperation({ summary: 'List contact messages (paginated)' })
  async findAll(
    @GetOrg() orgId: string,
    @Query() dto: QueryContactsDto,
  ) {
    return this.contactService.findAll(orgId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single contact message' })
  async findOne(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contactService.findOne(orgId, id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark contact message as read' })
  async markRead(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contactService.markRead(orgId, id, true);
  }

  @Patch(':id/unread')
  @ApiOperation({ summary: 'Mark contact message as unread' })
  async markUnread(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contactService.markRead(orgId, id, false);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a contact message' })
  async remove(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.contactService.remove(orgId, id);
  }
}
