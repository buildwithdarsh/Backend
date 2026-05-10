import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { PaginatedMeta } from '../../common/dto/api-response.dto.js';
import { CreateContactDto } from './dto/create-contact.dto.js';
import { QueryContactsDto } from './dto/query-contacts.dto.js';
import { SubscribeDto } from './dto/subscribe.dto.js';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Store a contact message from the storefront.
   */
  async create(orgId: string, dto: CreateContactDto) {
    const message = await this.prisma.contactMessage.create({
      data: {
        orgId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone ?? null,
        subject: dto.subject ?? null,
        service: dto.service ?? null,
        budget: dto.budget ?? null,
        message: dto.message,
      },
    });

    this.logger.log(
      `Contact message ${message.id} created for org ${orgId} from ${dto.email}`,
    );
    return message;
  }

  /**
   * List contact messages for an org with pagination and optional filters.
   */
  async findAll(orgId: string, dto: QueryContactsDto) {
    const where: Prisma.ContactMessageWhereInput = { orgId };

    if (dto.isRead !== undefined) {
      where.isRead = dto.isRead === 'true';
    }

    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { email: { contains: dto.search, mode: 'insensitive' } },
        { subject: { contains: dto.search, mode: 'insensitive' } },
        { service: { contains: dto.search, mode: 'insensitive' } },
        { message: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ContactMessageOrderByWithRelationInput = dto.sortBy
      ? { [dto.sortBy]: dto.sortOrder }
      : { createdAt: dto.sortOrder };

    const [data, total] = await Promise.all([
      this.prisma.contactMessage.findMany({
        where,
        orderBy,
        skip: dto.skip,
        take: dto.limit,
      }),
      this.prisma.contactMessage.count({ where }),
    ]);

    return {
      data,
      pagination: new PaginatedMeta(dto.page, dto.limit, total),
    };
  }

  /**
   * Get a single contact message.
   */
  async findOne(orgId: string, id: string) {
    const message = await this.prisma.contactMessage.findFirst({
      where: { id, orgId },
    });

    if (!message) {
      throw new NotFoundException(`Contact message "${id}" not found`);
    }

    return message;
  }

  /**
   * Mark a contact message as read/unread.
   */
  async markRead(orgId: string, id: string, isRead: boolean) {
    await this.findOne(orgId, id);

    return this.prisma.contactMessage.update({
      where: { id },
      data: { isRead },
    });
  }

  /**
   * Delete a contact message.
   */
  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);

    await this.prisma.contactMessage.delete({ where: { id } });
    return { deleted: true };
  }

  /**
   * Subscribe an email to the newsletter.
   * Upserts an EndUser with isSubscribedEmail=true and tags=['newsletter'].
   */
  async subscribe(orgId: string, dto: SubscribeDto) {
    const email = dto.email.toLowerCase().trim();

    const existing = await this.prisma.endUser.findFirst({
      where: { orgId, email },
    });

    if (existing) {
      const tags = new Set(existing.tags);
      tags.add('newsletter');
      if (dto.source) tags.add(`source:${dto.source}`);

      await this.prisma.endUser.update({
        where: { id: existing.id },
        data: {
          isSubscribedEmail: true,
          tags: Array.from(tags),
        },
      });

      this.logger.log(`Subscriber ${email} updated for org ${orgId}`);
      return { subscribed: true };
    }

    const tags = ['newsletter'];
    if (dto.source) tags.push(`source:${dto.source}`);

    await this.prisma.endUser.create({
      data: {
        orgId,
        name: dto.name ?? null,
        email,
        isSubscribedEmail: true,
        tags,
        attributes: {} as Prisma.InputJsonValue,
      },
    });

    this.logger.log(`New subscriber ${email} created for org ${orgId}`);
    return { subscribed: true };
  }
}
