import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SuperAppService } from './superapp.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('superapp')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('superapp')
export class SuperAppController {
  constructor(private readonly superapp: SuperAppService) {}

  // ─── Bill Payments ──────────────────────────────────────────────────────

  @Post('bills/pay')
  @ApiOperation({ summary: 'Pay a utility bill (electricity, water, telecom, TV)' })
  payBill(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.superapp.payBill(userId, body);
  }

  @Get('bills')
  @ApiOperation({ summary: 'List my bill payments' })
  listBills(@CurrentUser('id') userId: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.superapp.listBillPayments(userId, Number(page), Number(limit));
  }

  // ─── Insurance ──────────────────────────────────────────────────────────

  @Post('insurance/purchase')
  @ApiOperation({ summary: 'Purchase an insurance policy' })
  purchaseInsurance(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.superapp.purchaseInsurance(userId, body);
  }

  @Post('insurance/:policyId/claim')
  @ApiOperation({ summary: 'File an insurance claim' })
  fileClaim(@CurrentUser('id') userId: string, @Param('policyId') policyId: string, @Body() body: any) {
    return this.superapp.fileClaim(userId, policyId, body);
  }

  @Get('insurance')
  @ApiOperation({ summary: 'List my insurance policies' })
  listPolicies(@CurrentUser('id') userId: string) {
    return this.superapp.listMyPolicies(userId);
  }

  // ─── Loyalty ────────────────────────────────────────────────────────────

  @Get('loyalty')
  @ApiOperation({ summary: 'Get my loyalty account (points, tier)' })
  loyalty(@CurrentUser('id') userId: string) {
    return this.superapp.getOrCreateAccount(userId);
  }

  @Post('loyalty/redeem')
  @ApiOperation({ summary: 'Redeem loyalty points for a reward' })
  redeem(@CurrentUser('id') userId: string, @Body() body: any) {
    return this.superapp.redeemPoints(userId, body);
  }

  // ─── Driver Loans ───────────────────────────────────────────────────────

  @Post('loans/apply')
  @ApiOperation({ summary: 'Driver applies for a loan against future earnings' })
  applyForLoan(@CurrentUser('id') userId: string, @Body() body: any) {
    // Resolve driverId from userId
    return (async () => {
      const { PrismaService } = await import('../common/prisma.service');
      // Note: in production, inject PrismaService properly
      return this.superapp.applyForLoan(body.driverId ?? userId, body);
    })();
  }
}
