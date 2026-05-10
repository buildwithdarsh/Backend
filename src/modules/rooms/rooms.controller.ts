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
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetOrg, Public } from '../../common/decorators/index.js';
import type { RequestWithOrg } from '../../common/types/index.js';
import { EndUserJwtGuard } from '../end-user-auth/guards/enduser-jwt.guard.js';
import { RoomsService } from './rooms.service.js';
import { CreateRoomDto } from './dto/create-room.dto.js';
import { JoinRoomDto } from './dto/join-room.dto.js';
import { SwitchModeDto } from './dto/switch-mode.dto.js';

@ApiTags('Storefront - Watch Rooms')
@Controller('api/v1/storefront/rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  // ─── Public Endpoints ────────────────────────────────────────────────────

  @Get('live')
  @Public()
  @ApiOperation({ summary: 'List live rooms (paginated)' })
  async listLive(
    @GetOrg() orgId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.roomsService.listLive(orgId, { page, limit });
  }

  @Get('movie/:tmdbId')
  @Public()
  @ApiOperation({ summary: 'List live rooms for a specific movie' })
  async listForMovie(
    @GetOrg() orgId: string,
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
  ) {
    return this.roomsService.listForMovie(orgId, tmdbId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get room detail with optional viewer status' })
  async getRoom(
    @Req() req: RequestWithOrg,
    @GetOrg() orgId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const endUserId = req.endUser?.id;
    return this.roomsService.getRoom(orgId, id, endUserId);
  }

  // ─── EndUser Protected Endpoints ─────────────────────────────────────────

  @Post()
  @UseGuards(EndUserJwtGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new watch room' })
  async createRoom(
    @Req() req: RequestWithOrg,
    @Body() dto: CreateRoomDto,
  ) {
    return this.roomsService.createRoom(req.orgId, req.endUser!.id, dto);
  }

  @Post(':id/go-live')
  @UseGuards(EndUserJwtGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Host starts the room (go live)' })
  async goLive(
    @Req() req: RequestWithOrg,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.roomsService.goLive(req.orgId, id, req.endUser!.id);
  }

  @Post(':id/join')
  @UseGuards(EndUserJwtGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join a live room' })
  async joinRoom(
    @Req() req: RequestWithOrg,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: JoinRoomDto,
  ) {
    return this.roomsService.joinRoom(
      req.orgId,
      id,
      req.endUser!.id,
      dto.mode,
    );
  }

  @Post(':id/leave')
  @UseGuards(EndUserJwtGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Leave a room' })
  async leaveRoom(
    @Req() req: RequestWithOrg,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.roomsService.leaveRoom(req.orgId, id, req.endUser!.id);
  }

  @Post(':id/switch-mode')
  @UseGuards(EndUserJwtGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Switch between sync and solo mode' })
  async switchMode(
    @Req() req: RequestWithOrg,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SwitchModeDto,
  ) {
    return this.roomsService.switchMode(
      req.orgId,
      id,
      req.endUser!.id,
      dto.mode,
    );
  }

  @Post(':id/end')
  @UseGuards(EndUserJwtGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Host ends the room' })
  async endRoom(
    @Req() req: RequestWithOrg,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.roomsService.endRoom(req.orgId, id, req.endUser!.id);
  }
}
