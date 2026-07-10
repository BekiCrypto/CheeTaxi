import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'FINANCE', 'REGIONAL_MANAGER', 'AUDITOR')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('executive')
  @ApiOperation({ summary: 'Executive dashboard — high-level KPIs for the last N days' })
  executive(@Query('days') days = 30) {
    return this.analytics.getExecutiveDashboard(Number(days));
  }

  @Get('revenue/trend')
  @ApiOperation({ summary: 'Daily revenue trend for the last N days' })
  revenueTrend(@Query('days') days = 30) {
    return this.analytics.getRevenueTrend(Number(days));
  }

  @Get('passengers/cohorts')
  @ApiOperation({ summary: 'Passenger retention by signup cohort' })
  cohorts(@Query('months') months = 6) {
    return this.analytics.getPassengerCohorts(Number(months));
  }

  @Get('drivers/churn')
  @ApiOperation({ summary: 'Driver churn analysis' })
  driverChurn(@Query('days') days = 90) {
    return this.analytics.getDriverChurn(Number(days));
  }

  @Get('cities/comparison')
  @ApiOperation({ summary: 'City-level performance comparison' })
  cityComparison() {
    return this.analytics.getCityComparison();
  }

  @Get('revenue/forecast')
  @ApiOperation({ summary: 'Revenue forecast (linear regression projection)' })
  revenueForecast(@Query('days') days = 30) {
    return this.analytics.getRevenueForecast(Number(days));
  }
}
