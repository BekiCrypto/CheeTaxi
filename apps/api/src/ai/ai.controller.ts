import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'FRAUD', 'OPERATIONS')
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Get('fraud/trip/:tripId')
  @ApiOperation({ summary: 'Score a trip for fraud risk (0=safe, 1=fraud)' })
  scoreTrip(@Param('tripId') tripId: string) {
    return this.ai.scoreTripFraud(tripId);
  }

  @Post('fraud/payment')
  @ApiOperation({ summary: 'Score a payment for fraud risk' })
  scorePayment(@Query('userId') userId: string, @Query('amount') amount: number, @Query('provider') provider: string) {
    return this.ai.scorePaymentFraud(userId, Number(amount), provider);
  }

  @Get('pricing/surge')
  @ApiOperation({ summary: 'Compute optimal surge multiplier for a location' })
  surge(@Query('lat') lat: number, @Query('lng') lng: number, @Query('city') city = 'Addis Ababa') {
    return this.ai.computeOptimalSurge(Number(lat), Number(lng), city);
  }

  @Get('demand/predict')
  @ApiOperation({ summary: 'Predict demand (expected trip requests) for the next hour' })
  predict(@Query('city') city = 'Addis Ababa') {
    return this.ai.predictDemandNextHour(city);
  }
}
