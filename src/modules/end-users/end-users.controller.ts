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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetOrg } from '../../common/decorators/index.js';
import { EndUsersService } from './end-users.service.js';
import { CreateEndUserDto } from './dto/create-end-user.dto.js';
import { UpdateEndUserDto } from './dto/update-end-user.dto.js';
import { BulkUpsertEndUserDto } from './dto/bulk-upsert-end-user.dto.js';
import { QueryEndUsersDto } from './dto/query-end-users.dto.js';
import { UpdateAttributesDto } from './dto/update-attributes.dto.js';

@ApiTags('End Users')
@Controller('api/v1/end-users')
export class EndUsersController {
  constructor(private readonly endUsersService: EndUsersService) {}

  @Get()
  @ApiOperation({ summary: 'List end users (paginated, filterable)' })
  async findAll(
    @GetOrg() orgId: string,
    @Query() dto: QueryEndUsersDto,
  ) {
    return this.endUsersService.findAll(orgId, dto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new end user' })
  async create(
    @GetOrg() orgId: string,
    @Body() dto: CreateEndUserDto,
  ) {
    return this.endUsersService.create(orgId, dto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk upsert end users by externalId' })
  async bulkUpsert(
    @GetOrg() orgId: string,
    @Body() dto: BulkUpsertEndUserDto,
  ) {
    return this.endUsersService.bulkUpsert(orgId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single end user by ID' })
  async findOne(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.endUsersService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an end user' })
  async update(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEndUserDto,
  ) {
    return this.endUsersService.update(orgId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete an end user' })
  async remove(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.endUsersService.remove(orgId, id);
  }

  @Post(':id/block')
  @ApiOperation({ summary: 'Block an end user' })
  async block(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.endUsersService.block(orgId, id);
  }

  @Post(':id/unblock')
  @ApiOperation({ summary: 'Unblock an end user' })
  async unblock(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.endUsersService.unblock(orgId, id);
  }

  @Patch(':id/attributes')
  @ApiOperation({ summary: 'Merge-update end user custom attributes' })
  async updateAttributes(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAttributesDto,
  ) {
    return this.endUsersService.updateAttributes(orgId, id, dto);
  }

  @Post(':id/tags')
  @ApiOperation({ summary: 'Add tags to an end user' })
  async addTags(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('tags') tags: string[],
  ) {
    return this.endUsersService.addTags(orgId, id, tags);
  }

  @Delete(':id/tags')
  @ApiOperation({ summary: 'Remove tags from an end user' })
  async removeTags(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('tags') tags: string[],
  ) {
    return this.endUsersService.removeTags(orgId, id, tags);
  }
}
