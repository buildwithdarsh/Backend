import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../database/prisma.service.js';
import type { EndUserJwtPayload } from '../../../common/types/index.js';

@Injectable()
export class EndUserJwtStrategy extends PassportStrategy(Strategy, 'enduser-jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const publicKey = configService.getOrThrow<string>('JWT_PUBLIC_KEY');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['RS256'],
      secretOrKey: publicKey,
      issuer: 'techzunction',
    });
  }

  async validate(payload: EndUserJwtPayload): Promise<EndUserJwtPayload> {
    if (payload.type !== 'enduser_access') {
      throw new UnauthorizedException('Invalid token type');
    }

    if (!payload.orgId || !payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Verify org exists and is active
    const org = await this.prisma.organization.findUnique({
      where: { id: payload.orgId },
      select: { id: true, status: true },
    });

    if (!org) {
      throw new UnauthorizedException('Organization not found');
    }

    if (org.status === 'suspended') {
      throw new UnauthorizedException('Organization is suspended');
    }

    const endUser = await this.prisma.endUser.findUnique({
      where: { id: payload.sub },
      select: { id: true, status: true, deletedAt: true },
    });

    if (!endUser || endUser.deletedAt) {
      throw new UnauthorizedException('User not found');
    }

    if (endUser.status === 'blocked') {
      throw new UnauthorizedException('User account is blocked');
    }

    return payload;
  }
}
