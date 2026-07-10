import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
import { createHmac, randomBytes } from 'crypto';

/**
 * Crypto/stablecoin payment rails.
 *
 * Supports:
 *   • USDT (Tether) — ERC-20 + TRC-20
 *   • USDC — ERC-20
 *   • cUSD (Celo Dollar) — popular in Africa via Valora / Celo
 *   • BTC (Bitcoin) — Lightning Network for instant settlement
 *
 * Flow:
 *   1. User selects crypto payment → generates a unique deposit address
 *   2. User sends crypto to the address
 *   3. Webhook from payment provider confirms on-chain transaction
 *   4. CheeTaxi credits the user's wallet at the current exchange rate
 *
 * For payouts (driver withdrawals):
 *   1. Driver requests withdrawal to a crypto address
 *   2. CheeTaxi initiates an on-chain transaction via the provider API
 *   3. Transaction hash recorded for transparency
 */
@Injectable()
export class CryptoService {
  private readonly logger = new Logger('CryptoService');

  // Supported tokens + their chain
  private readonly SUPPORTED_TOKENS: Record<string, { chain: string; symbol: string; decimals: number }> = {
    USDT_TRC20: { chain: 'tron', symbol: 'USDT', decimals: 6 },
    USDT_ERC20: { chain: 'ethereum', symbol: 'USDT', decimals: 6 },
    USDC_ERC20: { chain: 'ethereum', symbol: 'USDC', decimals: 6 },
    CUSD_CELO: { chain: 'celo', symbol: 'cUSD', decimals: 18 },
    BTC_LIGHTNING: { chain: 'lightning', symbol: 'BTC', decimals: 8 },
  };

  // Exchange rates (ETB per 1 unit) — real impl fetches from an oracle
  private readonly RATES: Record<string, number> = {
    USDT: 128, // 1 USDT ≈ 128 ETB
    USDC: 128,
    CUSD: 128,
    BTC: 7_800_000, // 1 BTC ≈ 7.8M ETB
  };

  constructor(
    private prisma: PrismaService,
    private wallets: WalletsService,
    private config: ConfigService,
  ) {}

  /** List supported crypto tokens + current exchange rates. */
  listSupportedTokens() {
    return Object.entries(this.SUPPORTED_TOKENS).map(([key, token]) => ({
      id: key,
      symbol: token.symbol,
      chain: token.chain,
      rateEtb: this.RATES[token.symbol] ?? 0,
    }));
  }

  /** Generate a deposit address for a user to send crypto to. */
  async generateDepositAddress(userId: string, token: string): Promise<{ address: string; expiresAt: string; amountExpected?: number }> {
    if (!this.SUPPORTED_TOKENS[token]) {
      throw new BadRequestException(`Unsupported token: ${token}`);
    }

    // Real impl: call the payment provider's API to generate a unique address
    // (e.g., Tatum, Alchemy, or Fireblocks for institutional)
    // For TRC-20 / TRON: generate a Tron address
    // For ERC-20 / Ethereum: generate an Ethereum address
    // For Celo: generate a Celo address
    // For Lightning: generate a Lightning invoice

    const address = this.generateMockAddress(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Record the pending deposit
    await this.prisma.payment.create({
      data: {
        userId,
        amount: 0, // will be set when deposit arrives
        currency: token,
        method: 'WALLET' as any,
        provider: 'crypto',
        providerRef: address,
        status: 'PENDING' as any,
        providerPayload: { token, address, expiresAt: expiresAt.toISOString() } as any,
      },
    });

    return { address, expiresAt: expiresAt.toISOString() };
  }

  /** Handle a webhook from the crypto payment provider. */
  async handleDepositWebhook(payload: {
    address: string; token: string; amount: string; txHash: string;
  }): Promise<{ credited: boolean; amountEtb: number }> {
    // Find the pending payment by address
    const payment = await this.prisma.payment.findFirst({
      where: { providerRef: payload.address, provider: 'crypto', status: 'PENDING' },
    });
    if (!payment) return { credited: false, amountEtb: 0 };

    const tokenInfo = this.SUPPORTED_TOKENS[payload.token];
    if (!tokenInfo) return { credited: false, amountEtb: 0 };

    const amount = Number(payload.amount) / Math.pow(10, tokenInfo.decimals);
    const rate = this.RATES[tokenInfo.symbol] ?? 0;
    const amountEtb = Math.round(amount * rate * 100) / 100;

    // Credit user wallet
    await this.wallets.topUp(payment.userId, amountEtb, 'ETB', 'crypto_deposit', payload.txHash);

    // Mark payment as success
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCESS' as any,
        amount: amountEtb,
        providerRef: payload.txHash,
        processedAt: new Date(),
      },
    });

    this.logger.log(`Crypto deposit credited: ${amount} ${tokenInfo.symbol} → ${amountEtb} ETB for user ${payment.userId}`);
    return { credited: true, amountEtb };
  }

  /** Withdraw to a crypto address. */
  async withdrawToCrypto(userId: string, amountEtb: number, token: string, destinationAddress: string): Promise<{ txHash: string; amount: number }> {
    if (!this.SUPPORTED_TOKENS[token]) {
      throw new BadRequestException(`Unsupported token: ${token}`);
    }
    if (amountEtb <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const tokenInfo = this.SUPPORTED_TOKENS[token];
    const rate = this.RATES[tokenInfo.symbol] ?? 0;
    const tokenAmount = amountEtb / rate;

    // Charge the user's wallet
    await this.wallets.charge(userId, amountEtb, 'ETB', 'CRYPTO_WITHDRAWAL');

    // Real impl: call the provider's withdrawal API
    // For now, generate a mock transaction hash
    const txHash = '0x' + randomBytes(32).toString('hex');

    this.logger.log(`Crypto withdrawal: ${amountEtb} ETB → ${tokenAmount} ${tokenInfo.symbol} to ${destinationAddress}`);
    return { txHash, amount: tokenAmount };
  }

  private generateMockAddress(token: string): string {
    const tokenInfo = this.SUPPORTED_TOKENS[token];
    switch (tokenInfo.chain) {
      case 'tron':
        return 'T' + randomBytes(20).toString('hex').slice(0, 33);
      case 'ethereum':
      case 'celo':
        return '0x' + randomBytes(20).toString('hex');
      case 'lightning':
        return 'lnbc' + randomBytes(20).toString('base64url').slice(0, 50);
      default:
        return randomBytes(32).toString('hex');
    }
  }
}
