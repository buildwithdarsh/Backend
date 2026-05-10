import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../database/prisma.service.js';
import type { JwtPayload } from '../../../common/types/index.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
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

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    if (!payload.orgId || !payload.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Verify org exists
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

    // Verify user exists and is not deleted/suspended
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, status: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status === 'suspended' || user.status === 'blocked') {
      throw new UnauthorizedException('User account is suspended');
    }

    return payload;
  }
}
