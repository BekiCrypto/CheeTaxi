import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CarbonService } from './carbon.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('carbon')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('carbon')
export class CarbonController {
  constructor(private readonly carbon: CarbonService) {}

  @Get('footprint')
  @ApiOperation({ summary: 'Get my carbon footprint for the last N days' })
  footprint(@CurrentUser('id') userId: string, @Query('days') days = 30) {
    return this.carbon.getCarbonFootprint(userId, Number(days));
  }

  @Post('offset/:tripId')
  @ApiOperation({ summary: 'Offset carbon emissions for a specific trip' })
  offset(@CurrentUser('id') userId: string, @Param('tripId') tripId: string) {
    return this.carbon.offsetTrip(tripId, userId);
  }
}
