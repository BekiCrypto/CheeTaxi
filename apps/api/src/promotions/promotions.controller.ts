import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promos: PromotionsService) {}

  @Get()
  @ApiOperation({ summary: 'List active promo codes' })
  list() {
    return this.promos.listActive();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'MARKETING')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a promo code' })
  create(@Body() body: any) {
    return this.promos.createPromo(body);
  }

  @Post('redeem')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Redeem a promo code' })
  redeem(@CurrentUser('id') userId: string, @Body() body: { code: string; tripId?: string }) {
    return this.promos.redeem(userId, body.code, body.tripId);
  }

  @Get('referrals/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List my referrals' })
  myReferrals(@CurrentUser('id') userId: string) {
    return this.promos.listReferrals(userId);
  }
}
