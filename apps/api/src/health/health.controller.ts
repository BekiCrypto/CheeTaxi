import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../common/prisma.service';
import { RedisService } from '../common/redis.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe — checks DB + Redis connectivity' })
  async readiness() {
    const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};

    // Postgres
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      checks.postgres = { status: 'ok', latencyMs: Date.now() - start };
    } catch (err) {
      checks.postgres = { status: 'fail', error: (err as Error).message };
    }

    // Redis
    try {
      const start = Date.now();
      const pong = await this.redis.raw.ping();
      checks.redis = { status: pong === 'PONG' ? 'ok' : 'fail', latencyMs: Date.now() - start };
    } catch (err) {
      checks.redis = { status: 'fail', error: (err as Error).message };
    }

    const allOk = Object.values(checks).every((c) => c.status === 'ok');
    return {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}
