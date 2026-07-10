// Jest setup — ensure required env vars exist before any test imports NestJS modules
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-do-not-use-in-prod';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '30d';
process.env.DATABASE_URL = 'postgresql://cheetaxi:cheetaxi@localhost:5432/cheetaxi_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.SMS_PROVIDER = 'console';
process.env.BRAND_NAME = 'CheeTaxi';
