import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger('Redis');
  private readonly client: Redis;

  constructor() {
    this.client = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    });
    this.client.on('connect', () => this.logger.log('Connected to Redis'));
    this.client.on('error', (err) => this.logger.error(`Redis error: ${err.message}`));
  }

  get raw(): Redis {
    return this.client;
  }

  async get<T = string>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.set(key, serialized, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async del(...keys: string[]): Promise<number> {
    return this.client.del(...keys);
  }

  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.client.expire(key, ttlSeconds);
  }

  /** Acquire a distributed lock. Returns release fn or null. */
  async acquireLock(key: string, ttlMs = 5000): Promise<(() => Promise<void>) | null> {
    const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const ok = await this.client.set(key, token, 'PX', ttlMs, 'NX');
    if (!ok) return null;
    return async () => {
      // Lua-based safe release — only release if token matches
      const lua = `if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end`;
      await this.client.eval(lua, 1, key, token);
    };
  }

  /** Geo commands — used for nearby-driver search. */
  async geoAdd(key: string, lng: number, lat: number, member: string): Promise<void> {
    await this.client.geoadd(key, lng, lat, member);
  }

  async geoRadius(
    key: string,
    lng: number,
    lat: number,
    radiusMeters: number,
  ): Promise<Array<{ member: string; distance: number }>> {
    const res = (await this.client.georadius(
      key,
      lng,
      lat,
      radiusMeters,
      'm',
      'WITHDIST',
    )) as unknown as Array<[string, string]>;
    return res.map(([member, distance]) => ({ member, distance: Number(distance) }));
  }

  async geoRemove(key: string, member: string): Promise<void> {
    await this.client.zrem(key, member);
  }

  onModuleDestroy() {
    void this.client.quit();
  }
}
