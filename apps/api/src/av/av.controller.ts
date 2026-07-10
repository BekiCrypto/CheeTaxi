import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AvService } from './av.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('av')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'OPERATIONS')
@Controller('av')
export class AvController {
  constructor(private readonly av: AvService) {}

  @Post('fleets')
  @ApiOperation({ summary: 'Register an AV fleet provider (Waymo, Cruise, etc.)' })
  registerFleet(@Body() body: any) {
    return this.av.registerFleet(body);
  }

  @Post('fleets/:fleetId/vehicles')
  @ApiOperation({ summary: 'Register an AV vehicle' })
  registerVehicle(@Param('fleetId') fleetId: string, @Body() body: any) {
    return this.av.registerVehicle(fleetId, body);
  }

  @Post('heartbeat/:vehicleIdentifier')
  @ApiOperation({ summary: 'AV heartbeat (called by fleet provider)' })
  heartbeat(@Param('vehicleIdentifier') id: string, @Body() body: any) {
    return this.av.heartbeat(id, body);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby AVs' })
  nearby(@Query('lat') lat: number, @Query('lng') lng: number, @Query('radius') radius = 5000) {
    return this.av.findNearbyAvs(Number(lat), Number(lng), Number(radius));
  }

  @Post('vehicles/:vehicleId/dispatch')
  @ApiOperation({ summary: 'Dispatch an AV to a trip' })
  dispatch(@Param('vehicleId') id: string, @Body() body: { tripId: string }) {
    return this.av.dispatchAv(id, body.tripId);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get AV fleet status for ops dashboard' })
  status() {
    return this.av.getFleetStatus();
  }
}
