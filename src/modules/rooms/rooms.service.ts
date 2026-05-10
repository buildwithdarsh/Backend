import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import { GDriveService } from '../../services/gdrive/gdrive.service.js';
import { AblyService } from '../../services/ably/ably.service.js';
import type { CreateRoomDto } from './dto/create-room.dto.js';

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);

  constructor(
    private readonly prisma: PrismaService,
    _gdriveService: GDriveService,
    private readonly ablyService: AblyService,
  ) {}

  /**
   * Verify the host has a connected Google Drive source.
   */
  private async ensureGoogleDriveConnected(orgId: string, hostId: string) {
    const source = await this.prisma.connectedSource.findFirst({
      where: { orgId, endUserId: hostId, provider: 'google_drive' },
    });

    if (!source) {
      throw new ForbiddenException('Connect Google Drive to host rooms');
    }
  }

  /**
   * Create a new watch room.
   */
  async createRoom(orgId: string, hostId: string, dto: CreateRoomDto) {
    // Ensure host has connected their Google Drive
    await this.ensureGoogleDriveConnected(orgId, hostId);

    // Check for existing live/waiting room for same movie
    const existingRoom = await this.prisma.playFlixRoom.findFirst({
      where: {
        orgId,
        tmdbId: dto.tmdbId,
        status: { in: ['waiting', 'live'] },
      },
    });
    if (existingRoom) {
      throw new HttpException(
        'A room already exists for this movie. Join the existing room instead.',
        HttpStatus.CONFLICT,
      );
    }

    const room = await this.prisma.playFlixRoom.create({
      data: {
        orgId,
        hostId,
        tmdbId: dto.tmdbId,
        movieTitle: dto.movieTitle,
        posterUrl: dto.posterUrl ?? null,
        gdriveFileId: dto.gdriveFileId,
        name: dto.name,
        privacy: dto.privacy ?? 'public',
        vibe: dto.vibe ?? 'chill',
        ratePerMinPaise: dto.ratePerMinPaise,
        maxViewers: dto.maxViewers ?? 50,
        status: 'live',
        startedAt: new Date(),
      },
    });

    this.logger.log(`Room created: ${room.id} by host ${hostId}`);

    return { room };
  }

  /**
   * Host takes the room live.
   */
  async goLive(orgId: string, roomId: string, hostId: string) {
    const room = await this.prisma.playFlixRoom.findFirst({
      where: { id: roomId, orgId, hostId, status: 'waiting' },
    });

    if (!room) {
      throw new NotFoundException('Room not found or not in waiting status');
    }

    const updated = await this.prisma.playFlixRoom.update({
      where: { id: roomId },
      data: { status: 'live', startedAt: new Date() },
    });

    this.logger.log(`Room went live: ${roomId}`);

    return { room: updated };
  }

  /**
   * Get room detail with viewer count.
   */
  async getRoom(orgId: string, roomId: string, endUserId?: string) {
    const room = await this.prisma.playFlixRoom.findFirst({
      where: { id: roomId, orgId },
      include: {
        host: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { viewers: { where: { leftAt: null } } } },
      },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Check if user is already a viewer
    let viewerStatus: { isJoined: boolean; mode: string | null } = { isJoined: false, mode: null };
    if (endUserId) {
      const viewer = await this.prisma.playFlixRoomViewer.findFirst({
        where: { roomId, endUserId, leftAt: null },
      });
      if (viewer) {
        viewerStatus = { isJoined: true, mode: viewer.mode };
      }
    }

    return { room, viewerStatus };
  }

  /**
   * End user joins a room.
   */
  async joinRoom(
    orgId: string,
    roomId: string,
    endUserId: string,
    mode: string,
  ) {
    const room = await this.prisma.playFlixRoom.findFirst({
      where: { id: roomId, orgId },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Ensure room is live — auto-set if waiting or ended
    if (room.status !== 'live') {
      await this.prisma.playFlixRoom.update({
        where: { id: roomId },
        data: { status: 'live', startedAt: room.startedAt || new Date(), endedAt: null },
      });
    }

    if (room.viewerCount >= room.maxViewers) {
      throw new HttpException('Room is full', HttpStatus.CONFLICT);
    }

    // Check if already joined (and hasn't left)
    const existing = await this.prisma.playFlixRoomViewer.findFirst({
      where: { roomId, endUserId, leftAt: null },
    });

    if (existing) {
      // Already in room — return existing data instead of error
      const ablyToken = await this.ablyService.createToken(
        endUserId,
        `playflix:${roomId}`,
      );
      return {
        viewer: existing,
        room: await this.prisma.playFlixRoom.findUnique({ where: { id: roomId } }),
        ablyToken,
      };
    }

    const [viewer] = await this.prisma.$transaction([
      this.prisma.playFlixRoomViewer.create({
        data: {
          roomId,
          endUserId,
          mode: mode as 'sync' | 'solo',
        },
      }),
      this.prisma.playFlixRoom.update({
        where: { id: roomId },
        data: { viewerCount: { increment: 1 } },
      }),
    ]);

    this.logger.log(`User ${endUserId} joined room ${roomId} in ${mode} mode`);

    const ablyToken = await this.ablyService.createToken(
      endUserId,
      `playflix:${roomId}`,
    );

    return {
      viewer,
      room: await this.prisma.playFlixRoom.findUnique({ where: { id: roomId } }),
      ablyToken,
    };
  }

  /**
   * End user leaves a room.
   */
  async leaveRoom(orgId: string, roomId: string, endUserId: string) {
    const viewer = await this.prisma.playFlixRoomViewer.findFirst({
      where: { roomId, endUserId, leftAt: null, room: { orgId } },
    });

    if (!viewer) {
      throw new NotFoundException('Not currently in this room');
    }

    await this.prisma.$transaction([
      this.prisma.playFlixRoomViewer.update({
        where: { id: viewer.id },
        data: { leftAt: new Date() },
      }),
      this.prisma.playFlixRoom.update({
        where: { id: roomId },
        data: { viewerCount: { decrement: 1 } },
      }),
    ]);

    this.logger.log(`User ${endUserId} left room ${roomId}`);

    return { message: 'Left room successfully' };
  }

  /**
   * Switch viewer mode between sync and solo.
   */
  async switchMode(
    orgId: string,
    roomId: string,
    endUserId: string,
    mode: string,
  ) {
    const viewer = await this.prisma.playFlixRoomViewer.findFirst({
      where: { roomId, endUserId, leftAt: null, room: { orgId } },
    });

    if (!viewer) {
      throw new NotFoundException('Not currently in this room');
    }

    const updated = await this.prisma.playFlixRoomViewer.update({
      where: { id: viewer.id },
      data: { mode: mode as 'sync' | 'solo' },
    });

    this.logger.log(`User ${endUserId} switched to ${mode} in room ${roomId}`);

    return { viewer: updated };
  }

  /**
   * Host ends the room. Bills all active viewers, calculates host earnings.
   */
  async endRoom(orgId: string, roomId: string, hostId: string) {
    const room = await this.prisma.playFlixRoom.findFirst({
      where: { id: roomId, orgId, hostId, status: { in: ['waiting', 'live'] } },
    });

    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const now = new Date();

    // End all active watch sessions for viewers in this room
    const activeViewers = await this.prisma.playFlixRoomViewer.findMany({
      where: { roomId, leftAt: null },
    });

    // Mark all viewers as left
    if (activeViewers.length > 0) {
      await this.prisma.playFlixRoomViewer.updateMany({
        where: { roomId, leftAt: null },
        data: { leftAt: now },
      });
    }

    // End any active watch sessions linked to this room
    await this.prisma.watchSession.updateMany({
      where: {
        id: { in: activeViewers.map((v) => v.sessionId).filter(Boolean) as string[] },
        status: { in: ['active', 'paused'] },
      },
      data: { status: 'ended', endedAt: now },
    });

    // Calculate earnings: sum up all viewer billing for this room
    const viewerSessions = await this.prisma.watchSession.findMany({
      where: {
        id: { in: activeViewers.map((v) => v.sessionId).filter(Boolean) as string[] },
      },
      select: { totalBilledPaise: true, minutesBilled: true },
    });

    const grossPaise = viewerSessions.reduce(
      (sum, s) => sum + s.totalBilledPaise,
      0,
    );
    const totalViewerMinutes = viewerSessions.reduce(
      (sum, s) => sum + s.minutesBilled,
      0,
    );

    // 70% host / 30% platform
    const hostSharePaise = Math.floor(grossPaise * 0.7);
    const platformSharePaise = grossPaise - hostSharePaise;

    // Create host earning record
    if (grossPaise > 0) {
      await this.prisma.hostEarning.create({
        data: {
          orgId,
          roomId,
          hostId,
          totalViewerMinutes,
          grossPaise,
          hostSharePaise,
          platformSharePaise,
          status: 'pending',
        },
      });
    }

    // End the room
    const updatedRoom = await this.prisma.playFlixRoom.update({
      where: { id: roomId },
      data: { status: 'ended', endedAt: now, viewerCount: 0 },
    });

    this.logger.log(
      `Room ended: ${roomId} | gross=${grossPaise} hostShare=${hostSharePaise} platformShare=${platformSharePaise}`,
    );

    return {
      room: updatedRoom,
      earnings: {
        grossPaise,
        hostSharePaise,
        platformSharePaise,
        totalViewerMinutes,
      },
    };
  }

  /**
   * List live rooms (paginated, ordered by viewerCount desc).
   */
  async listLive(
    orgId: string,
    params?: { page?: number; limit?: number },
  ) {
    const page = params?.page ?? 1;
    const limit = Math.min(params?.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const [rooms, total] = await Promise.all([
      this.prisma.playFlixRoom.findMany({
        where: { orgId },
        orderBy: { viewerCount: 'desc' },
        skip,
        take: limit,
        include: {
          host: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      this.prisma.playFlixRoom.count({
        where: { orgId },
      }),
    ]);

    return {
      rooms,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * List live rooms for a specific movie.
   */
  async listForMovie(orgId: string, tmdbId: number) {
    const rooms = await this.prisma.playFlixRoom.findMany({
      where: { orgId, tmdbId },
      orderBy: { viewerCount: 'desc' },
      include: {
        host: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    return rooms;
  }
}
