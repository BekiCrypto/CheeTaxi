import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PassengersService } from './passengers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('passengers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('passengers')
export class PassengersController {
  constructor(private readonly passengers: PassengersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the current passenger profile + favorites + saved places' })
  me(@CurrentUser('id') userId: string) {
    return this.passengers.getProfile(userId);
  }

  @Get('me/trips')
  @ApiOperation({ summary: 'Get trip history' })
  trips(@CurrentUser('id') userId: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.passengers.getTripHistory(userId, Number(page), Number(limit));
  }

  @Post('me/places')
  @ApiOperation({ summary: 'Add a saved place (home, work, etc.)' })
  addPlace(
    @CurrentUser('id') userId: string,
    @Body() body: { label: string; address: string; latitude: number; longitude: number; placeType?: string },
  ) {
    return this.passengers.addSavedPlace(userId, body);
  }

  @Delete('me/places/:placeId')
  @ApiOperation({ summary: 'Remove a saved place' })
  removePlace(@CurrentUser('id') userId: string, @Param('placeId') placeId: string) {
    return this.passengers.removeSavedPlace(userId, placeId);
  }

  @Post('me/favorites/:driverId')
  @ApiOperation({ summary: 'Add a driver to favorites' })
  addFavorite(@CurrentUser('id') userId: string, @Param('driverId') driverId: string, @Body() body: { nickname?: string }) {
    return this.passengers.addFavoriteDriver(userId, driverId, body.nickname);
  }

  @Delete('me/favorites/:driverId')
  @ApiOperation({ summary: 'Remove a favorite driver' })
  removeFavorite(@CurrentUser('id') userId: string, @Param('driverId') driverId: string) {
    return this.passengers.removeFavoriteDriver(userId, driverId);
  }
}
