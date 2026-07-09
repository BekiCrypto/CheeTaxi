import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GeoService } from './geo.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('geo')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('geo')
export class GeoController {
  constructor(private readonly geo: GeoService) {}

  @Get('geocode')
  @ApiOperation({ summary: 'Geocode address → coordinates' })
  geocode(@Query('q') q: string) {
    return this.geo.geocode(q);
  }

  @Get('reverse')
  @ApiOperation({ summary: 'Reverse geocode coordinates → address' })
  reverse(@Query('lat') lat: number, @Query('lng') lng: number) {
    return this.geo.reverseGeocode(Number(lat), Number(lng));
  }

  @Get('places')
  @ApiOperation({ summary: 'Search saved places (landmarks, airports)' })
  places(@Query('q') q: string, @Query('country') country?: string) {
    return this.geo.searchPlaces(q, country);
  }

  @Get('geofence/check')
  @ApiOperation({ summary: 'Check if a point is inside a geofence' })
  checkGeofence(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('type') type?: string,
  ) {
    return this.geo.checkGeofence(Number(lat), Number(lng), type);
  }
}
