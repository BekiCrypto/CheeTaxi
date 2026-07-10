import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subs: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({ summary: 'List all subscription plans' })
  plans() {
    return this.subs.listPlans();
  }

  @Get('me/active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my active subscription' })
  myActive(@CurrentUser('id') userId: string) {
    return this.subs.getMyActive(userId);
  }

  @Get('me/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my subscription history' })
  myHistory(@CurrentUser('id') userId: string) {
    return this.subs.listMyHistory(userId);
  }

  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Purchase a subscription plan' })
  purchase(@CurrentUser('id') userId: string, @Body() body: { planCode: string; paymentMethod: string; autoRenew?: boolean; driverIds?: string[] }) {
    return this.subs.purchase(userId, body);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a subscription' })
  cancel(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() body: { reason: string }) {
    return this.subs.cancel(userId, id, body.reason);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN', 'FINANCE', 'OPERATIONS')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: list all subscriptions' })
  list(@Query('page') page = 1, @Query('limit') limit = 50, @Query('status') status?: string) {
    return this.subs.listAll(Number(page), Number(limit), status);
  }
}
