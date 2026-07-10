import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CryptoService } from './crypto.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('crypto')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('crypto')
export class CryptoController {
  constructor(private readonly crypto: CryptoService) {}

  @Get('tokens')
  @ApiOperation({ summary: 'List supported crypto tokens + exchange rates' })
  listTokens() {
    return this.crypto.listSupportedTokens();
  }

  @Post('deposit/address')
  @ApiOperation({ summary: 'Generate a deposit address for a crypto token' })
  generateAddress(@CurrentUser('id') userId: string, @Body() body: { token: string }) {
    return this.crypto.generateDepositAddress(userId, body.token);
  }

  @Post('deposit/webhook')
  @ApiOperation({ summary: 'Crypto payment provider webhook (no auth — signature verified)' })
  webhook(@Body() body: any) {
    return this.crypto.handleDepositWebhook(body);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Withdraw to a crypto address' })
  withdraw(
    @CurrentUser('id') userId: string,
    @Body() body: { amountEtb: number; token: string; destinationAddress: string },
  ) {
    return this.crypto.withdrawToCrypto(userId, body.amountEtb, body.token, body.destinationAddress);
  }
}
