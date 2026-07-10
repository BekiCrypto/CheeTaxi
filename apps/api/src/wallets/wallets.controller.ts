import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('wallets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallets')
export class WalletsController {
  constructor(private readonly wallets: WalletsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my wallet balance' })
  me(@CurrentUser('id') userId: string) {
    return this.wallets.getMyWallet(userId);
  }

  @Post('me/topup')
  @ApiOperation({ summary: 'Top up wallet (provider webhook confirms amount)' })
  topUp(@CurrentUser('id') userId: string, @Body() body: { amount: number; currency: string; provider: string; providerRef?: string }) {
    return this.wallets.topUp(userId, body.amount, body.currency, body.provider, body.providerRef);
  }

  @Post('me/withdraw')
  @ApiOperation({ summary: 'Driver withdrawal request' })
  withdraw(@CurrentUser('id') userId: string, @Body() body: { amount: number; method: string; destination?: unknown }) {
    return this.wallets.requestWithdrawal(userId, body.amount, body.method, body.destination);
  }

  @Get('me/transactions')
  @ApiOperation({ summary: 'List wallet transactions' })
  transactions(@CurrentUser('id') userId: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.wallets.listTransactions(userId, Number(page), Number(limit));
  }
}
