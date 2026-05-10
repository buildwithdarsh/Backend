import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { KycDocumentType, KycStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service.js';

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(private readonly prisma: PrismaService) {}

  async submit(
    orgId: string,
    endUserId: string,
    data: {
      documentType: KycDocumentType;
      documentNumber: string;
      documentUrl?: string;
      selfieUrl?: string;
    },
  ) {
    const existing = await this.prisma.kycVerification.findUnique({
      where: {
        orgId_endUserId_documentType: {
          orgId,
          endUserId,
          documentType: data.documentType,
        },
      },
    });

    if (existing && existing.status === 'verified') {
      throw new ConflictException(
        `${data.documentType} already verified`,
      );
    }

    const kyc = await this.prisma.kycVerification.upsert({
      where: {
        orgId_endUserId_documentType: {
          orgId,
          endUserId,
          documentType: data.documentType,
        },
      },
      create: {
        orgId,
        endUserId,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        documentUrl: data.documentUrl ?? null,
        selfieUrl: data.selfieUrl ?? null,
        status: 'submitted',
      },
      update: {
        documentNumber: data.documentNumber,
        documentUrl: data.documentUrl ?? null,
        selfieUrl: data.selfieUrl ?? null,
        status: 'submitted',
        rejectionNote: null,
      },
    });

    this.logger.log(
      `KYC submitted: org=${orgId} user=${endUserId} type=${data.documentType}`,
    );

    return kyc;
  }

  async getStatus(orgId: string, endUserId: string) {
    const verifications = await this.prisma.kycVerification.findMany({
      where: { orgId, endUserId },
      orderBy: { createdAt: 'desc' },
    });

    const isFullyVerified =
      verifications.length >= 2 &&
      verifications.every((v) => v.status === 'verified');

    return { verifications, isFullyVerified };
  }

  async getById(orgId: string, id: string) {
    const kyc = await this.prisma.kycVerification.findFirst({
      where: { id, orgId },
    });

    if (!kyc) throw new NotFoundException('KYC verification not found');
    return kyc;
  }

  async verify(
    orgId: string,
    id: string,
    data: { status: KycStatus; rejectionNote?: string },
  ) {
    const kyc = await this.prisma.kycVerification.findFirst({
      where: { id, orgId },
    });

    if (!kyc) throw new NotFoundException('KYC verification not found');

    return this.prisma.kycVerification.update({
      where: { id },
      data: {
        status: data.status,
        rejectionNote: data.rejectionNote ?? null,
        verifiedAt: data.status === 'verified' ? new Date() : null,
      },
    });
  }

  async listPending(orgId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.kycVerification.findMany({
        where: { orgId, status: 'submitted' },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
        include: { endUser: { select: { id: true, name: true, email: true, phone: true } } },
      }),
      this.prisma.kycVerification.count({
        where: { orgId, status: 'submitted' },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
