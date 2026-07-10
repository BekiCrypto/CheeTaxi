import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TripsService } from './trips.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('trips')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trips')
export class TripsController {
  constructor(private readonly trips: TripsService) {}

  @Post('request')
  @ApiOperation({ summary: 'Request a new trip' })
  request(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.trips.request({ passengerUserId: userId, ...body });
  }

  @Post(':id/accept')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Driver accepts a trip' })
  accept(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.trips.accept(userId, id);
  }

  @Post(':id/arrive')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Driver arrived at pickup' })
  arrive(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.trips.arrive(userId, id);
  }

  @Post(':id/start')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Driver starts the trip' })
  start(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.trips.start(userId, id);
  }

  @Post(':id/complete')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Driver completes the trip' })
  complete(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: { actualDistanceMeters?: number; actualDurationSeconds?: number },
  ) {
    return this.trips.complete(userId, id, body);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a trip (passenger, driver, or system)' })
  cancel(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: { reason: string; by?: 'passenger' | 'driver' | 'system' },
  ) {
    return this.trips.cancel(userId, id, body.reason, body.by ?? 'passenger');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get trip detail' })
  get(@Param('id') id: string) {
    return this.trips.getById(id);
  }

  @Get('share/:token')
  @ApiOperation({ summary: 'Public trip tracking by share token' })
  share(@Param('token') token: string) {
    return this.trips.getPublicByShareToken(token);
  }

  @Get('me/passenger')
  @ApiOperation({ summary: 'List my trips as passenger' })
  myPassengerTrips(@CurrentUser('id') userId: string, @Query('page') page = 1, @Query('limit') limit = 20, @Query('status') status?: string) {
    return this.trips.listForPassenger(userId, Number(page), Number(limit), status);
  }

  @Get('me/driver')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'List my trips as driver' })
  myDriverTrips(@CurrentUser('id') userId: string, @Query('page') page = 1, @Query('limit') limit = 20, @Query('status') status?: string) {
    return this.trips.listForDriver(userId, Number(page), Number(limit), status);
  }
}
