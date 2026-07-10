import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DriversService } from './drivers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('drivers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('drivers')
export class DriversController {
  constructor(private readonly drivers: DriversService) {}

  @Post('onboard')
  @ApiOperation({ summary: 'Start driver onboarding (KYC submission)' })
  onboard(
    @CurrentUser('id') userId: string,
    @Body() body: { licenseNumber: string; licenseExpiry: string; licenseFrontUrl: string; licenseBackUrl?: string },
  ) {
    return this.drivers.onboard(userId, body);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get the current driver profile' })
  me(@CurrentUser('id') userId: string) {
    return this.drivers.getProfile(userId);
  }

  @Post('me/status')
  @ApiOperation({ summary: 'Go online / offline' })
  setStatus(@CurrentUser('id') userId: string, @Body() body: { online: boolean }) {
    return this.drivers.setOnlineStatus(userId, body.online);
  }

  @Post('me/location')
  @ApiOperation({ summary: 'Update driver location (called every 5-10s when online)' })
  updateLocation(
    @CurrentUser('id') userId: string,
    @Body() body: { latitude: number; longitude: number; heading?: number; speedKmh?: number; accuracyMeters?: number },
  ) {
    return this.drivers.updateLocation(userId, body);
  }

  @Get('me/earnings')
  @ApiOperation({ summary: 'Get earnings summary' })
  earnings(@CurrentUser('id') userId: string, @Query('days') days = 30) {
    return this.drivers.getEarningsSummary(userId, Number(days));
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find nearby online drivers (dispatch internal use)' })
  nearby(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius = 3000,
    @Query('limit') limit = 20,
  ) {
    return this.drivers.findNearby(
      { latitude: Number(lat), longitude: Number(lng) },
      Number(radius),
      Number(limit),
    );
  }

  @Get('pending')
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'OPERATIONS', 'COMPLIANCE')
  @ApiOperation({ summary: 'List drivers pending KYC approval' })
  pending(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.drivers.listPending(Number(page), Number(limit));
  }

  @Patch(':id/approve')
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'COMPLIANCE')
  @ApiOperation({ summary: 'Approve driver (post-KYC)' })
  approve(@Param('id') id: string, @CurrentUser('id') approver: string) {
    return this.drivers.approve(id, approver);
  }

  @Patch(':id/reject')
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'COMPLIANCE')
  @ApiOperation({ summary: 'Reject driver' })
  reject(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.drivers.reject(id, body.reason);
  }
}
