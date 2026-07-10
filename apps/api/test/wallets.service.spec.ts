import { WalletsService } from '../src/wallets/wallets.service';
import { PrismaService } from '../src/common/prisma.service';
import { RealtimeGateway } from '../src/realtime/realtime.gateway';

describe('WalletsService', () => {
  let service: WalletsService;
  let prismaMock: any;
  let realtimeMock: any;

  beforeEach(() => {
    prismaMock = {
      wallet: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      walletTransaction: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
      driver: { findUnique: jest.fn() },
      withdrawalRequest: { create: jest.fn() },
      $transaction: jest.fn(async (cb: any) => cb({
        wallet: {
          update: jest.fn().mockResolvedValue({ balance: 150 }),
        },
        walletTransaction: { create: jest.fn() },
      })),
    };
    realtimeMock = {
      emitWalletUpdate: jest.fn(),
    };
    service = new WalletsService(prismaMock as PrismaService, realtimeMock as unknown as RealtimeGateway);
  });

  describe('getMyWallet', () => {
    it('returns existing wallet', async () => {
      prismaMock.wallet.findUnique.mockResolvedValue({ id: 'w1', userId: 'u1', balance: 100, currency: 'ETB' });
      const w = await service.getMyWallet('u1');
      expect(w.id).toBe('w1');
    });

    it('creates a new wallet if none exists', async () => {
      prismaMock.wallet.findUnique.mockResolvedValue(null);
      prismaMock.wallet.create.mockResolvedValue({ id: 'w1', userId: 'u1', balance: 0, currency: 'ETB' });
      const w = await service.getMyWallet('u1');
      expect(prismaMock.wallet.create).toHaveBeenCalled();
      expect(w.balance).toBe(0);
    });
  });

  describe('topUp', () => {
    it('rejects non-positive amount', async () => {
      await expect(service.topUp('u1', -10, 'ETB', 'stripe')).rejects.toThrow(/positive/i);
      await expect(service.topUp('u1', 0, 'ETB', 'stripe')).rejects.toThrow(/positive/i);
    });

    it('increments balance and emits realtime update', async () => {
      prismaMock.wallet.findUnique.mockResolvedValue({ id: 'w1', userId: 'u1', balance: 100, currency: 'ETB' });
      await service.topUp('u1', 50, 'ETB', 'stripe');
      expect(prismaMock.$transaction).toHaveBeenCalled();
      expect(realtimeMock.emitWalletUpdate).toHaveBeenCalledWith('u1', '150', 'ETB');
    });
  });

  describe('charge', () => {
    it('rejects when balance is insufficient', async () => {
      prismaMock.wallet.findUnique.mockResolvedValue({ id: 'w1', userId: 'u1', balance: 30, currency: 'ETB' });
      await expect(service.charge('u1', 50, 'ETB', 'TRIP_PAYMENT')).rejects.toThrow(/Insufficient/i);
    });

    it('decrements balance and emits realtime update', async () => {
      prismaMock.wallet.findUnique.mockResolvedValue({ id: 'w1', userId: 'u1', balance: 100, currency: 'ETB' });
      await service.charge('u1', 50, 'ETB', 'TRIP_PAYMENT', 'trip123');
      expect(realtimeMock.emitWalletUpdate).toHaveBeenCalled();
    });
  });

  describe('creditDriver', () => {
    it('throws if driver not found', async () => {
      prismaMock.driver.findUnique.mockResolvedValue(null);
      await expect(service.creditDriver('d1', 100, 'ETB', 'trip1')).rejects.toThrow(/Driver not found/i);
    });

    it('creates a wallet for driver if missing and credits earnings', async () => {
      prismaMock.driver.findUnique.mockResolvedValue({ id: 'd1', userId: 'u-driver' });
      prismaMock.wallet.findUnique.mockResolvedValue(null);
      prismaMock.wallet.create.mockResolvedValue({ id: 'w-driver', userId: 'u-driver', balance: 0, currency: 'ETB' });
      await service.creditDriver('d1', 200, 'ETB', 'trip-abc');
      expect(realtimeMock.emitWalletUpdate).toHaveBeenCalledWith('u-driver', '150', 'ETB');
    });
  });

  describe('requestWithdrawal', () => {
    it('rejects withdrawal exceeding balance', async () => {
      prismaMock.wallet.findUnique.mockResolvedValue({ id: 'w1', userId: 'u1', balance: 50, currency: 'ETB' });
      await expect(
        service.requestWithdrawal('u1', 100, 'bank', { account: '123' }),
      ).rejects.toThrow(/Insufficient/i);
    });
  });
});
