/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test', '<rootDir>/test/integration'],
  testMatch: ['**/*.integration-spec.ts'],
  moduleNameMapper: {
    '^@cheetaxi/database$': '<rootDir>/../../packages/database/src',
    '^@cheetaxi/shared$': '<rootDir>/../../packages/shared/src',
  },
  setupFilesAfterEnv: ['<rootDir>/test/integration-setup.ts'],
  testTimeout: 120000, // Testcontainers can be slow to start
  verbose: true,
};
