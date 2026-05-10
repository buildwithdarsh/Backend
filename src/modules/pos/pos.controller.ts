import {
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetOrg } from '../../common/decorators/index.js';
import { PosService } from './pos.service.js';
import { QuerySyncLogsDto } from './dto/index.js';

@ApiTags('Admin - POS')

@Controller('api/v1/pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Post('sync')
  @ApiOperation({ summary: 'Trigger a manual POS menu sync' })
  @ApiResponse({ status: 201, description: 'Sync completed' })
  triggerSync(@GetOrg() orgId: string) {
    return this.posService.syncMenu(orgId, 'manual');
  }

  @Get('logs')
  @ApiOperation({ summary: 'List POS sync logs' })
  @ApiResponse({ status: 200, description: 'Paginated sync logs' })
  findSyncLogs(@GetOrg() orgId: string, @Query() query: QuerySyncLogsDto) {
    return this.posService.findSyncLogs(orgId, query.page, query.limit);
  }
}
