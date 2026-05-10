import { Controller, Get, Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/index.js';
import { PrismaService } from '../../database/prisma.service.js';

@ApiTags('Health')
@Controller('api/v1/health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env['npm_package_version'] ?? '0.0.1',
    };
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check with dependency status (requires auth)' })
  @ApiResponse({ status: 200, description: 'Detailed health status' })
  async detailedHealthCheck() {
    const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};

    // Check database connection
    const dbStart = Date.now();
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      checks['database'] = {
        status: 'healthy',
        latencyMs: Date.now() - dbStart,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      checks['database'] = {
        status: 'unhealthy',
        latencyMs: Date.now() - dbStart,
        error: message,
      };
      this.logger.error(`Database health check failed: ${message}`);
    }

    const allHealthy = Object.values(checks).every((c) => c.status === 'healthy');

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env['npm_package_version'] ?? '0.0.1',
      checks,
    };
  }
}
