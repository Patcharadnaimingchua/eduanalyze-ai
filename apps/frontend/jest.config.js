// Unit tests for pure helpers under src/lib (no DOM, no React). Uses its own
// CommonJS tsconfig because the app's is ESM/bundler for Next.
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }] },
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
};
