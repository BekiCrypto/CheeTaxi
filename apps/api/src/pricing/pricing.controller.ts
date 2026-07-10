import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricing: PricingService) {}

  @Get('quote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a fare estimate for a trip' })
  quote(@Query() q: any) {
    return this.pricing.getQuote({
      vehicleType: q.vehicleType,
      pickup: { lat: Number(q.pickupLat), lng: Number(q.pickupLng), address: q.pickupAddress },
      dropoff: { lat: Number(q.dropoffLat), lng: Number(q.dropoffLng), address: q.dropoffAddress },
      city: q.city,
      country: q.country,
      scheduledFor: q.scheduledFor,
      promoCode: q.promoCode,
    });
  }

  @Get('tiers')
  @ApiOperation({ summary: 'List all active pricing tiers' })
  tiers() {
    return this.pricing.listTiers();
  }

  @Post('surge')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'OPERATIONS')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set a surge multiplier for a geohash' })
  setSurge(@Body() body: { geohash: string; multiplier: number; reason: string; durationMinutes?: number }) {
    return this.pricing.setSurge(body.geohash, body.multiplier, body.reason, body.durationMinutes);
  }
}
