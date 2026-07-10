import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RatingsService } from './ratings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('ratings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratings: RatingsService) {}

  @Post('trips/:tripId')
  @ApiOperation({ summary: 'Rate a trip (passenger rates driver or vice versa)' })
  rate(@CurrentUser('id') userId: string, @Param('tripId') tripId: string, @Body() body: { role: 'PASSENGER_TO_DRIVER' | 'DRIVER_TO_PASSENGER'; stars: number; comment?: string; tags?: string[] }) {
    return this.ratings.rateTrip(userId, tripId, body);
  }
}
