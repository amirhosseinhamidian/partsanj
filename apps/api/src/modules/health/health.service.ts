import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check() {
    const startedAt = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'ok',
        service: 'partsanj-api',
        timestamp: new Date().toISOString(),
        database: {
          status: 'ok',
          latencyMs: Date.now() - startedAt,
        },
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        service: 'partsanj-api',
        database: {
          status: 'unavailable',
        },
      });
    }
  }
}
