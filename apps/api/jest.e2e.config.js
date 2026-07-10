/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test/e2e'],
  testMatch: ['**/*.e2e-spec.ts'],
  moduleNameMapper: {
    '^@cheetaxi/database$': '<rootDir>/../../packages/database/src',
    '^@cheetaxi/shared$': '<rootDir>/../../packages/shared/src',
  },
  setupFilesAfterEnv: ['<rootDir>/test/integration-setup.ts'],
  testTimeout: 180000,
  verbose: true,
};
