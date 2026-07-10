// Integration test setup — starts a real PostgreSQL container + Redis container
// via Testcontainers, runs Prisma migrations, and exposes the connection URLs
// to the test files.

import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

let postgresContainer: StartedTestContainer;
let redisContainer: StartedTestContainer;

export async function setupPostgres(): Promise<{ url: string; container: StartedTestContainer }> {
  postgresContainer = await new GenericContainer('postgres:16-alpine')
    .withEnvironment({
      POSTGRES_USER: 'cheetaxi_test',
      POSTGRES_PASSWORD: 'cheetaxi_test',
      POSTGRES_DB: 'cheetaxi_test',
    })
    .withExposedPorts(5432)
    .withWaitStrategy(Wait.forLogMessage('database system is ready to accept connections'))
    .start();

  const port = postgresContainer.getMappedPort(5432);
  const url = `postgresql://cheetaxi_test:cheetaxi_test@localhost:${port}/cheetaxi_test`;

  // Run Prisma migrations against the container
  process.env.DATABASE_URL = url;
  const schemaPath = path.join(__dirname, '..', '..', '..', 'packages', 'database', 'prisma', 'schema.prisma');
  execSync(`npx prisma migrate deploy --schema=${schemaPath}`, {
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'inherit',
  });

  return { url, container: postgresContainer };
}

export async function setupRedis(): Promise<{ url: string; container: StartedTestContainer }> {
  redisContainer = await new GenericContainer('redis:7-alpine')
    .withExposedPorts(6379)
    .withWaitStrategy(Wait.forLogMessage('Ready to accept connections'))
    .start();

  const port = redisContainer.getMappedPort(6379);
  const url = `redis://localhost:${port}`;
  return { url, container: redisContainer };
}

export async function teardownContainers(): Promise<void> {
  await postgresContainer?.stop().catch(() => undefined);
  await redisContainer?.stop().catch(() => undefined);
}
