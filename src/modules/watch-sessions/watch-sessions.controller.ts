import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RequestWithOrg } from '../../common/types/index.js';
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';
import { WatchSessionsService } from './watch-sessions.service.js';
import { StartSessionDto } from './dto/start-session.dto.js';
import { UpdateCapDto } from './dto/update-cap.dto.js';
import { RateSessionDto } from './dto/rate-session.dto.js';

@ApiTags('Storefront - Watch Sessions')
@UseGuards(EndUserJwtGuard)
@Controller('api/v1/storefront/movies')
export class WatchSessionsController {
  constructor(private readonly watchSessionsService: WatchSessionsService) {}

  @Post(':tmdbId/start-session')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Start a pay-per-minute watch session' })
  async startSession(
    @Req() req: RequestWithOrg,
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
    @Body() dto: StartSessionDto,
  ) {
    // Ensure the tmdbId in the URL matches the body
    dto.tmdbId = tmdbId;
    return this.watchSessionsService.startSession(
      req.orgId,
      req.endUser!.id,
      dto,
    );
  }

  @Get('session/:id/status')
  @ApiOperation({ summary: 'Get watch session status and wallet balance' })
  async getSessionStatus(
    @Req() req: RequestWithOrg,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.watchSessionsService.getSessionStatus(
      req.orgId,
      req.endUser!.id,
      id,
    );
  }

  @Post('session/:id/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause a watch session (bills elapsed time)' })
  async pauseSession(
    @Req() req: RequestWithOrg,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.watchSessionsService.pauseSession(
      req.orgId,
      req.endUser!.id,
      id,
    );
  }

  @Post('session/:id/resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resume a paused watch session' })
  async resumeSession(
    @Req() req: RequestWithOrg,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.watchSessionsService.resumeSession(
      req.orgId,
      req.endUser!.id,
      id,
    );
  }

  @Patch('session/:id/update-cap')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update meter cap (e.g. preview → unlimited)' })
  async updateCap(
    @Req() req: RequestWithOrg,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCapDto,
  ) {
    return this.watchSessionsService.updateCap(
      req.orgId,
      req.endUser!.id,
      id,
      dto.meterCapPaise,
    );
  }

  @Post('session/:id/end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End a watch session with final billing' })
  async endSession(
    @Req() req: RequestWithOrg,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.watchSessionsService.endSession(
      req.orgId,
      req.endUser!.id,
      id,
    );
  }

  @Patch('session/:id/rate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rate a watch session (1-5 stars)' })
  async rateSession(
    @Req() req: RequestWithOrg,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RateSessionDto,
  ) {
    return this.watchSessionsService.rateSession(
      req.orgId,
      req.endUser!.id,
      id,
      dto.rating,
    );
  }

  @Get('sessions/history')
  @ApiOperation({ summary: 'Get watch history (ended/capped sessions)' })
  async getHistory(
    @Req() req: RequestWithOrg,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.watchSessionsService.getHistory(
      req.orgId,
      req.endUser!.id,
      limit,
      offset,
    );
  }
}
