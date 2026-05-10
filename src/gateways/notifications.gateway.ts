import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

// ─── JWT Payload shape for socket auth ──────────────────────────────────────

interface SocketJwtPayload {
  sub: string;
  orgId: string;
  type: 'access';
}

// ─── Connected client metadata ──────────────────────────────────────────────

interface ConnectedClient {
  userId: string;
  orgId: string;
  connectedAt: Date;
}

// ─── Gateway ────────────────────────────────────────────────────────────────

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private readonly connectedClients = new Map<string, ConnectedClient>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ─── Connection Lifecycle ───────────────────────────────────────────────

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(
          `Client ${client.id} rejected: no authentication token`,
        );
        client.emit('error', { message: 'Authentication required' });
        client.disconnect(true);
        return;
      }

      const publicKey = this.configService.getOrThrow<string>('jwt.publicKey');
      const payload = await this.jwtService.verifyAsync<SocketJwtPayload>(
        token,
        {
          publicKey,
          algorithms: ['RS256'],
        },
      );

      if (payload.type !== 'access') {
        this.logger.warn(
          `Client ${client.id} rejected: invalid token type "${payload.type}"`,
        );
        client.emit('error', { message: 'Invalid token type' });
        client.disconnect(true);
        return;
      }

      const { sub: userId, orgId } = payload;

      // Join rooms for targeted event delivery
      const orgRoom = `org:${orgId}`;
      const userRoom = `user:${orgId}:${userId}`;

      await client.join(orgRoom);
      await client.join(userRoom);

      // Track connected client
      this.connectedClients.set(client.id, {
        userId,
        orgId,
        connectedAt: new Date(),
      });

      this.logger.log(
        `Client ${client.id} connected (user=${userId}, org=${orgId}) — rooms: [${orgRoom}, ${userRoom}]`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Authentication failed';
      this.logger.warn(
        `Client ${client.id} rejected: ${message}`,
      );
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const meta = this.connectedClients.get(client.id);
    if (meta) {
      this.logger.log(
        `Client ${client.id} disconnected (user=${meta.userId}, org=${meta.orgId})`,
      );
      this.connectedClients.delete(client.id);
    } else {
      this.logger.debug(`Client ${client.id} disconnected (unauthenticated)`);
    }
  }

  // ─── Emit Methods ──────────────────────────────────────────────────────

  /**
   * Emit an event to a specific user within an organization.
   */
  emitToUser(
    orgId: string,
    userId: string,
    event: string,
    data: unknown,
  ): void {
    const room = `user:${orgId}:${userId}`;
    this.server.to(room).emit(event, data);
    this.logger.debug(`Emitted "${event}" to ${room}`);
  }

  /**
   * Emit an event to all connected users in an organization.
   */
  emitToOrg(orgId: string, event: string, data: unknown): void {
    const room = `org:${orgId}`;
    this.server.to(room).emit(event, data);
    this.logger.debug(`Emitted "${event}" to ${room}`);
  }

  /**
   * Push a new notification to a specific end user or org user.
   */
  pushNotification(
    orgId: string,
    userId: string,
    notification: Record<string, unknown>,
  ): void {
    this.emitToUser(orgId, userId, 'notification.new', notification);
  }

  /**
   * Notify a user that a notification has been read.
   */
  pushNotificationRead(
    orgId: string,
    userId: string,
    notificationId: string,
  ): void {
    this.emitToUser(orgId, userId, 'notification.read', { id: notificationId });
  }

  /**
   * Broadcast campaign status update to the organization.
   */
  pushCampaignUpdate(
    orgId: string,
    campaign: Record<string, unknown>,
  ): void {
    this.emitToOrg(orgId, 'campaign.update', campaign);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────

  private extractToken(client: Socket): string | null {
    // Try Authorization header first (Bearer token)
    const authHeader =
      (client.handshake.headers.authorization as string | undefined) ?? '';
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    // Try query parameter
    const queryToken = client.handshake.query['token'];
    if (typeof queryToken === 'string' && queryToken.length > 0) {
      return queryToken;
    }

    // Try auth object (socket.io v4 auth)
    const authToken = (client.handshake.auth as Record<string, unknown>)?.['token'];
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    return null;
  }
}
