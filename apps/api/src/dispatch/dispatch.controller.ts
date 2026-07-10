import { Body, Controller, Get, Param, Post, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DispatchService } from './dispatch.service';
import { HeatMapService } from './heatmap.service';
import { PrismaService } from '../common/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('dispatch')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dispatch')
export class DispatchController {
  constructor(
    private readonly dispatch: DispatchService,
    private readonly heatmap: HeatMapService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('respond')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Driver responds to a trip offer' })
  async respond(
    @CurrentUser('id') userId: string,
    @Body() body: { tripId: string; accept: boolean },
  ) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new NotFoundException('Driver not found');
    return this.dispatch.respondToOffer(driver.id, body.tripId, body.accept);
  }

  @Get('heatmap')
  @ApiOperation({ summary: 'Get current heat map (demand vs supply per area)' })
  getHeatMap(
    @Query('city') city = 'Addis Ababa',
    @Query('swLat') swLat?: number,
    @Query('swLng') swLng?: number,
    @Query('neLat') neLat?: number,
    @Query('neLng') neLng?: number,
  ) {
    const viewport = swLat != null && swLng != null && neLat != null && neLng != null
      ? { sw: { lat: Number(swLat), lng: Number(swLng) }, ne: { lat: Number(neLat), lng: Number(neLng) } }
      : undefined;
    return this.heatmap.getHeatMap(city, viewport);
  }

  @Get('recommendations')
  @Roles('DRIVER')
  @ApiOperation({ summary: 'Get personalized driver recommendations (hot zones)' })
  async getRecommendations(
    @CurrentUser('id') userId: string,
    @Query('city') city = 'Addis Ababa',
    @Query('lat') lat: number,
    @Query('lng') lng: number,
  ) {
    const driver = await this.prisma.driver.findUnique({ where: { userId } });
    if (!driver) throw new NotFoundException('Driver not found');
    return this.heatmap.getDriverRecommendations(city, Number(lat), Number(lng));
  }
}
