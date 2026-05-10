import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { CreateTicketDto, UpdateTicketDto, QueryTicketsDto } from './dto/index.js';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  /**
   * Create a new support ticket.
   */
  async create(orgId: string, endUserId: string, dto: CreateTicketDto) {
    const ticket = await this.prisma.supportTicket.create({
      data: {
        orgId,
        endUserId,
        subject: dto.subject,
        body: dto.body,
        category: dto.category ?? null,
        priority: dto.priority ?? 'normal',
        commerceOrderId: dto.commerceOrderId ?? null,
      },
    });

    this.logger.log(`Support ticket created: ${ticket.id} by user ${endUserId} for org ${orgId}`);
    return ticket;
  }

  /**
   * List all tickets (admin) with pagination and filters.
   */
  async findAll(orgId: string, query: QueryTicketsDto) {
    const where: Prisma.SupportTicketWhereInput = { orgId };

    if (query.status) {
      where.status = query.status;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.search) {
      where.OR = [
        { subject: { contains: query.search, mode: 'insensitive' } },
        { body: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: { endUser: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  /**
   * Find tickets by end user.
   */
  async findByEndUser(orgId: string, endUserId: string, query: QueryTicketsDto) {
    const where: Prisma.SupportTicketWhereInput = { orgId, endUserId };

    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  /**
   * Get a single ticket.
   */
  async findOne(orgId: string, id: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id, orgId },
      include: { endUser: { select: { id: true, name: true, email: true, phone: true } } },
    });

    if (!ticket) {
      throw new NotFoundException(`Support ticket ${id} not found`);
    }

    return ticket;
  }

  // ─── Status & Assignment ────────────────────────────────────────────────

  /**
   * Update ticket status, priority, category, or assignment.
   */
  async update(orgId: string, id: string, dto: UpdateTicketDto) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id, orgId },
    });

    if (!ticket) {
      throw new NotFoundException(`Support ticket ${id} not found`);
    }

    const data: Prisma.SupportTicketUpdateInput = {};

    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === 'resolved' || dto.status === 'closed') {
        data.resolvedAt = new Date();
      }
    }

    if (dto.priority !== undefined) {
      data.priority = dto.priority;
    }

    if (dto.category !== undefined) {
      data.category = dto.category;
    }

    if (dto.assignedTo !== undefined) {
      data.assignedTo = dto.assignedTo;
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data,
    });

    this.logger.log(`Support ticket ${id} updated for org ${orgId}`);
    return updated;
  }

  /**
   * Assign a ticket to a user.
   */
  async assign(orgId: string, id: string, assignedTo: string) {
    return this.update(orgId, id, { assignedTo });
  }

  // ─── Messages / Replies ─────────────────────────────────────────────────

  /**
   * Add a reply/message to a support ticket.
   */
  async addReply(
    orgId: string,
    ticketId: string,
    senderId: string,
    senderType: string,
    body: string,
  ) {
    // Verify ticket exists and belongs to the org (and optionally the end user)
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id: ticketId, orgId },
    });

    if (!ticket) {
      throw new NotFoundException(`Support ticket ${ticketId} not found`);
    }

    // If the sender is an end user, verify they own the ticket
    if (senderType === 'enduser' && ticket.endUserId !== senderId) {
      throw new NotFoundException(`Support ticket ${ticketId} not found`);
    }

    const message = await this.prisma.supportMessage.create({
      data: {
        ticketId,
        senderType,
        senderId,
        body,
      },
    });

    this.logger.log(
      `Reply added to ticket ${ticketId} by ${senderType} ${senderId}`,
    );
    return message;
  }
}
