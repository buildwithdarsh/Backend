import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetOrg, GetUser } from '../../common/decorators/index.js';
import { ApiKeysService } from './api-keys.service.js';
import { CreateApiKeyDto } from './dto/create-api-key.dto.js';
import { UpdateApiKeyDto } from './dto/update-api-key.dto.js';

@ApiTags('API Keys')
@Controller('api/v1/api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  @ApiOperation({ summary: 'List all API keys (metadata only, no hashes)' })
  async findAll(@GetOrg() orgId: string) {
    return this.apiKeysService.findAll(orgId);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new API key (plain key returned only once)',
  })
  async create(
    @GetOrg() orgId: string,
    @GetUser('id') userId: string,
    @Body() dto: CreateApiKeyDto,
  ) {
    return this.apiKeysService.create(orgId, dto, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get API key metadata' })
  async findOne(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.apiKeysService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update API key name, scopes, or rate limit' })
  async update(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApiKeyDto,
  ) {
    return this.apiKeysService.update(orgId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke (soft-delete) an API key' })
  async revoke(
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.apiKeysService.revoke(orgId, id);
  }

  @Post(':id/rotate')
  @ApiOperation({
    summary: 'Rotate an API key (revoke old, create new with same config)',
  })
  async rotate(
    @GetOrg() orgId: string,
    @GetUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.apiKeysService.rotate(orgId, id, userId);
  }
}
