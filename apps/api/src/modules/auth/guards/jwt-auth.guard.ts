import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../../database/prisma.service.js';
import type { AuthenticatedUser } from '../types/authenticated-user.type.js';
import type { JwtAccessTokenPayload } from '../types/jwt-access-token-payload.type.js';

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Authentication token is required');
    }

    let payload: JwtAccessTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtAccessTokenPayload>(token);
    } catch {
      throw new UnauthorizedException('Authentication token is invalid or expired');
    }

    if (!payload.sub || !payload.mobile) {
      throw new UnauthorizedException('Authentication token is invalid');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
      select: {
        id: true,
        mobile: true,
        role: true,
        isActive: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user || !user.isActive || user.mobile !== payload.mobile) {
      throw new UnauthorizedException('Authentication token is no longer valid');
    }

    request.user = {
      id: user.id,
      mobile: user.mobile,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    return true;
  }

  private extractBearerToken(request: Request): string | undefined {
    const authorization = request.headers.authorization;

    if (!authorization) {
      return undefined;
    }

    const [scheme, token] = authorization.split(' ');

    return scheme === 'Bearer' && token ? token : undefined;
  }
}
