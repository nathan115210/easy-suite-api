import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default',
  testEnvironment: 'node',
  watchman: false,
  roots: ['<rootDir>/tests'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.test.json',
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};

export default config;
