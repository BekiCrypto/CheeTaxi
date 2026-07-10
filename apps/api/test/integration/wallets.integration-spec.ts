/**
 * Integration test for WalletsService — exercises atomic transactions and
 * balance tracking against a real PostgreSQL via Testcontainers.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/common/prisma.service';
import { WalletsService } from '../src/wallets/wallets.service';
import { RealtimeGateway } from '../src/realtime/realtime.gateway';
import { PrismaClient } from '@cheetaxi/database';
import { setupPostgres, teardownContainers } from '../integration-setup';

describe('WalletsService — integration (Testcontainers)', () => {
  let prisma: PrismaClient;
  let walletsService: WalletsService;
  let userId: string;

  beforeAll(async () => {
    const { url: dbUrl } = await setupPostgres();
    prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
    await prisma.$connect();

    const user = await prisma.user.create({
      data: { phone: '+251911000010', firstName: 'Wallet', lastName: 'Tester', role: 'PASSENGER', status: 'ACTIVE' },
    });
    userId = user.id;

    const prismaService = { ...prisma } as unknown as PrismaService;
    const realtimeGateway = { emitWalletUpdate: jest.fn() } as unknown as RealtimeGateway;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: PrismaService, useValue: prismaService },
        { provide: RealtimeGateway, useValue: realtimeGateway },
        WalletsService,
      ],
    }).compile();
    walletsService = module.get(WalletsService);
  }, 120000);

  afterAll(async () => {
    await prisma?.$disconnect();
    await teardownContainers();
  });

  it('creates a wallet on first access', async () => {
    const wallet = await walletsService.getMyWallet(userId);
    expect(wallet.balance.toString()).toBe('0');
    expect(wallet.currency).toBe('ETB');
  });

  it('tops up and tracks balance correctly', async () => {
    await walletsService.topUp(userId, 500, 'ETB', 'stripe', 'stripe_ref_1');
    const wallet = await walletsService.getMyWallet(userId);
    expect(Number(wallet.balance)).toBe(500);
  });

  it('charges and rejects insufficient balance', async () => {
    await walletsService.charge(userId, 200, 'ETB', 'TRIP_PAYMENT', 'trip1');
    let wallet = await walletsService.getMyWallet(userId);
    expect(Number(wallet.balance)).toBe(300);

    // Try to overcharge
    await expect(walletsService.charge(userId, 500, 'ETB', 'TRIP_PAYMENT', 'trip2')).rejects.toThrow(/Insufficient/i);

    wallet = await walletsService.getMyWallet(userId);
    expect(Number(wallet.balance)).toBe(300); // unchanged
  });

  it('records transactions with balance before/after', async () => {
    const txs = await prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    expect(txs.length).toBe(2); // topup + charge
    expect(txs[0].type).toBe('WALLET_TOP_UP');
    expect(Number(txs[0].amount)).toBe(500);
    expect(Number(txs[0].balanceBefore)).toBe(0);
    expect(Number(txs[0].balanceAfter)).toBe(500);

    expect(txs[1].type).toBe('TRIP_PAYMENT');
    expect(Number(txs[1].amount)).toBe(-200);
    expect(Number(txs[1].balanceBefore)).toBe(500);
    expect(Number(txs[1].balanceAfter)).toBe(300);
  });
});
