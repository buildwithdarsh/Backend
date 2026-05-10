import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';
import { PaginatedMeta } from '../../common/dto/api-response.dto.js';
import { CreateEndUserDto } from './dto/create-end-user.dto.js';
import { UpdateEndUserDto } from './dto/update-end-user.dto.js';
import { BulkUpsertEndUserDto } from './dto/bulk-upsert-end-user.dto.js';
import { QueryEndUsersDto } from './dto/query-end-users.dto.js';
import { UpdateAttributesDto } from './dto/update-attributes.dto.js';

/** Fields that must never be returned in API responses */
const OMIT_SENSITIVE = { passwordHash: true } as const;

@Injectable()
export class EndUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(orgId: string, dto: QueryEndUsersDto) {
    const where: Prisma.EndUserWhereInput = { orgId };

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.tags && dto.tags.length > 0) {
      where.tags = { hasSome: dto.tags };
    }

    if (dto.search) {
      where.OR = [
        { name: { contains: dto.search, mode: 'insensitive' } },
        { email: { contains: dto.search, mode: 'insensitive' } },
        { phone: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.EndUserOrderByWithRelationInput = dto.sortBy
      ? { [dto.sortBy]: dto.sortOrder }
      : { createdAt: dto.sortOrder };

    const [data, total] = await Promise.all([
      this.prisma.endUser.findMany({
        where,
        orderBy,
        skip: dto.skip,
        take: dto.limit,
        omit: OMIT_SENSITIVE,
      }),
      this.prisma.endUser.count({ where }),
    ]);

    return {
      data,
      pagination: new PaginatedMeta(dto.page, dto.limit, total),
    };
  }

  async findOne(orgId: string, id: string) {
    const endUser = await this.prisma.endUser.findFirst({
      where: { id, orgId },
      omit: OMIT_SENSITIVE,
    });

    if (!endUser) {
      throw new NotFoundException(`End user with ID "${id}" not found`);
    }

    return endUser;
  }

  async create(orgId: string, dto: CreateEndUserDto) {
    if (dto.externalId) {
      const existing = await this.prisma.endUser.findFirst({
        where: { orgId, externalId: dto.externalId },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException(
          `End user with externalId "${dto.externalId}" already exists`,
        );
      }
    }

    return this.prisma.endUser.create({
      data: {
        orgId,
        externalId: dto.externalId ?? null,
        name: dto.name,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        avatarUrl: dto.avatarUrl ?? null,
        fcmToken: dto.fcmToken ?? null,
        whatsappNumber: dto.whatsappNumber ?? null,
        tags: dto.tags ?? [],
        attributes: (dto.attributes ?? {}) as Prisma.InputJsonValue,
        isSubscribedEmail: dto.isSubscribedEmail ?? true,
        isSubscribedSms: dto.isSubscribedSms ?? true,
        isSubscribedWhatsapp: dto.isSubscribedWhatsapp ?? true,
        isSubscribedPush: dto.isSubscribedPush ?? true,
      },
      omit: OMIT_SENSITIVE,
    });
  }

  async bulkUpsert(orgId: string, dto: BulkUpsertEndUserDto) {
    const results = await this.prisma.$transaction(
      dto.endUsers.map((user) => {
        if (user.externalId) {
          return this.prisma.endUser.upsert({
            where: {
              orgId_externalId: {
                orgId,
                externalId: user.externalId,
              },
            },
            create: {
              orgId,
              externalId: user.externalId,
              name: user.name,
              email: user.email ?? null,
              phone: user.phone ?? null,
              avatarUrl: user.avatarUrl ?? null,
              fcmToken: user.fcmToken ?? null,
              whatsappNumber: user.whatsappNumber ?? null,
              tags: user.tags ?? [],
              attributes: (user.attributes ?? {}) as Prisma.InputJsonValue,
              isSubscribedEmail: user.isSubscribedEmail ?? true,
              isSubscribedSms: user.isSubscribedSms ?? true,
              isSubscribedWhatsapp: user.isSubscribedWhatsapp ?? true,
              isSubscribedPush: user.isSubscribedPush ?? true,
            },
            update: {
              ...(user.name !== undefined && { name: user.name }),
              ...(user.email !== undefined && { email: user.email ?? null }),
              ...(user.phone !== undefined && { phone: user.phone ?? null }),
              ...(user.avatarUrl !== undefined && { avatarUrl: user.avatarUrl ?? null }),
              ...(user.fcmToken !== undefined && { fcmToken: user.fcmToken ?? null }),
              ...(user.whatsappNumber !== undefined && { whatsappNumber: user.whatsappNumber ?? null }),
              ...(user.tags !== undefined && { tags: user.tags }),
              ...(user.attributes !== undefined && { attributes: user.attributes as Prisma.InputJsonValue }),
              ...(user.isSubscribedEmail !== undefined && { isSubscribedEmail: user.isSubscribedEmail }),
              ...(user.isSubscribedSms !== undefined && { isSubscribedSms: user.isSubscribedSms }),
              ...(user.isSubscribedWhatsapp !== undefined && { isSubscribedWhatsapp: user.isSubscribedWhatsapp }),
              ...(user.isSubscribedPush !== undefined && { isSubscribedPush: user.isSubscribedPush }),
            },
            omit: OMIT_SENSITIVE,
          });
        }

        // No externalId — always create
        return this.prisma.endUser.create({
          data: {
            orgId,
            name: user.name,
            email: user.email ?? null,
            phone: user.phone ?? null,
            avatarUrl: user.avatarUrl ?? null,
            fcmToken: user.fcmToken ?? null,
            whatsappNumber: user.whatsappNumber ?? null,
            tags: user.tags ?? [],
            attributes: (user.attributes ?? {}) as Prisma.InputJsonValue,
            isSubscribedEmail: user.isSubscribedEmail ?? true,
            isSubscribedSms: user.isSubscribedSms ?? true,
            isSubscribedWhatsapp: user.isSubscribedWhatsapp ?? true,
            isSubscribedPush: user.isSubscribedPush ?? true,
          },
          omit: OMIT_SENSITIVE,
        });
      }),
    );

    return { upserted: results.length, data: results };
  }

  async update(orgId: string, id: string, dto: UpdateEndUserDto) {
    await this.findOne(orgId, id);

    const data: Prisma.EndUserUpdateInput = {};

    if (dto.externalId !== undefined) data.externalId = dto.externalId;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.avatarUrl !== undefined) data.avatarUrl = dto.avatarUrl;
    if (dto.fcmToken !== undefined) data.fcmToken = dto.fcmToken;
    if (dto.whatsappNumber !== undefined) data.whatsappNumber = dto.whatsappNumber;
    if (dto.tags !== undefined) data.tags = dto.tags;
    if (dto.attributes !== undefined)
      data.attributes = dto.attributes as Prisma.InputJsonValue;
    if (dto.isSubscribedEmail !== undefined)
      data.isSubscribedEmail = dto.isSubscribedEmail;
    if (dto.isSubscribedSms !== undefined)
      data.isSubscribedSms = dto.isSubscribedSms;
    if (dto.isSubscribedWhatsapp !== undefined)
      data.isSubscribedWhatsapp = dto.isSubscribedWhatsapp;
    if (dto.isSubscribedPush !== undefined)
      data.isSubscribedPush = dto.isSubscribedPush;

    return this.prisma.endUser.update({
      where: { id },
      data,
      omit: OMIT_SENSITIVE,
    });
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id);

    await this.prisma.endUser.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { deleted: true };
  }

  async block(orgId: string, id: string) {
    await this.findOne(orgId, id);

    return this.prisma.endUser.update({
      where: { id },
      data: { status: 'blocked' },
      omit: OMIT_SENSITIVE,
    });
  }

  async unblock(orgId: string, id: string) {
    await this.findOne(orgId, id);

    return this.prisma.endUser.update({
      where: { id },
      data: { status: 'active' },
      omit: OMIT_SENSITIVE,
    });
  }

  async updateAttributes(orgId: string, id: string, dto: UpdateAttributesDto) {
    const endUser = await this.findOne(orgId, id);
    const existingAttributes =
      (endUser.attributes as Record<string, unknown>) ?? {};
    const merged = { ...existingAttributes, ...dto.attributes };

    return this.prisma.endUser.update({
      where: { id },
      data: { attributes: merged as Prisma.InputJsonValue },
      omit: OMIT_SENSITIVE,
    });
  }

  async addTags(orgId: string, id: string, tags: string[]) {
    const endUser = await this.findOne(orgId, id);
    const existingTags = new Set(endUser.tags);
    for (const tag of tags) {
      existingTags.add(tag);
    }

    return this.prisma.endUser.update({
      where: { id },
      data: { tags: Array.from(existingTags) },
      omit: OMIT_SENSITIVE,
    });
  }

  async removeTags(orgId: string, id: string, tags: string[]) {
    const endUser = await this.findOne(orgId, id);
    const tagsToRemove = new Set(tags);
    const updatedTags = endUser.tags.filter((t) => !tagsToRemove.has(t));

    return this.prisma.endUser.update({
      where: { id },
      data: { tags: updatedTags },
      omit: OMIT_SENSITIVE,
    });
  }
}
