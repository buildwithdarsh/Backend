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
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { GetOrg, GetUser } from '../../common/decorators/index.js';
import { SegmentsService } from './segments.service.js';
import { CreateSegmentDto } from './dto/create-segment.dto.js';
import { UpdateSegmentDto } from './dto/update-segment.dto.js';
import { AddMembersDto } from './dto/add-members.dto.js';

@ApiTags('Segments')
@Controller('api/v1/segments')
export class SegmentsController {
  constructor(private readonly segmentsService: SegmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List segments (paginated)' })
  async findAll(
    @GetOrg() orgId: string,
    @Query() dto: PaginationDto,
  ) {
    return this.segmentsService.findAll(orgId, dto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new segment' })
  async create(
    @GetOrg() orgId: string,
    @GetUser('id') userId: string,
    @Body() dto: CreateSegmentDto,
  ) {
    return this.segmentsService.create(orgId, dto, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get segment details with member count' })
  async findOne(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.segmentsService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a segment' })
  async update(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSegmentDto,
  ) {
    return this.segmentsService.update(orgId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a segment' })
  async remove(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.segmentsService.remove(orgId, id);
  }

  @Post(':id/preview')
  @ApiOperation({ summary: 'Preview dynamic segment (count + sample)' })
  async preview(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.segmentsService.preview(orgId, id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'List members of a segment (paginated)' })
  async getMembers(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() dto: PaginationDto,
  ) {
    return this.segmentsService.getMembers(orgId, id, dto);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add end users to a static segment' })
  async addMembers(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddMembersDto,
  ) {
    return this.segmentsService.addMembers(orgId, id, dto);
  }

  @Delete(':id/members/:uid')
  @ApiOperation({ summary: 'Remove an end user from a static segment' })
  async removeMember(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('uid', ParseUUIDPipe) uid: string,
  ) {
    return this.segmentsService.removeMember(orgId, id, uid);
  }
}
