import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('stats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(
  'SUPER_ADMIN',
  'PLATFORM_ADMIN',
  'OPERATIONS',
  'FINANCE',
  'REGIONAL_MANAGER',
  'CITY_MANAGER',
  'AUDITOR',
)
@Controller('stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get('platform')
  @ApiOperation({ summary: 'Platform-wide stats for admin dashboard' })
  platform() {
    return this.stats.getPlatformStats();
  }

  @Get('trips/funnel')
  @ApiOperation({ summary: 'Trip funnel for a date range' })
  funnel(@Query('from') from?: string, @Query('to') to?: string) {
    const now = new Date();
    const fromD = from ? new Date(from) : new Date(now.getTime() - 24 * 3600 * 1000);
    const toD = to ? new Date(to) : now;
    return this.stats.getTripFunnel(fromD, toD);
  }
}
