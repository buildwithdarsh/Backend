import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service.js';
import type { CreateAddressDto } from './dto/create-address.dto.js';
import type { UpdateAddressDto } from './dto/update-address.dto.js';

@Injectable()
export class EndUserAddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(orgId: string, endUserId: string) {
    return this.prisma.endUserAddress.findMany({
      where: { orgId, endUserId, deletedAt: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(orgId: string, endUserId: string, id: string) {
    const address = await this.prisma.endUserAddress.findFirst({
      where: { id, orgId, endUserId, deletedAt: null },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  async create(orgId: string, endUserId: string, dto: CreateAddressDto) {
    // If this is set as default, unset other defaults first
    if (dto.isDefault) {
      await this.prisma.endUserAddress.updateMany({
        where: { orgId, endUserId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.endUserAddress.create({
      data: {
        orgId,
        endUserId,
        label: dto.label ?? null,
        line1: dto.line1,
        line2: dto.line2 ?? null,
        city: dto.city,
        state: dto.state ?? null,
        pincode: dto.pincode,
        country: dto.country ?? 'IN',
        lat: dto.lat ?? null,
        lng: dto.lng ?? null,
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  async update(orgId: string, endUserId: string, id: string, dto: UpdateAddressDto) {
    const existing = await this.findOne(orgId, endUserId, id);

    if (dto.isDefault) {
      await this.prisma.endUserAddress.updateMany({
        where: { orgId, endUserId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.endUserAddress.update({
      where: { id: existing.id },
      data: {
        ...(dto.label !== undefined && { label: dto.label }),
        ...(dto.line1 !== undefined && { line1: dto.line1 }),
        ...(dto.line2 !== undefined && { line2: dto.line2 }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.state !== undefined && { state: dto.state }),
        ...(dto.pincode !== undefined && { pincode: dto.pincode }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.lat !== undefined && { lat: dto.lat }),
        ...(dto.lng !== undefined && { lng: dto.lng }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      },
    });
  }

  async remove(orgId: string, endUserId: string, id: string) {
    const existing = await this.findOne(orgId, endUserId, id);

    await this.prisma.endUserAddress.update({
      where: { id: existing.id },
      data: { deletedAt: new Date() },
    });
  }
}
