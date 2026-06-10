/**
 * jest.config.ts — Jest configuration for AITS Shop
 *
 * Strategy: Use plain Jest (no jest-expo preset) for unit-testing
 * pure TypeScript utilities, Zustand stores, and API functions.
 * These tests have zero native module dependencies.
 *
 * UI / component tests → use Detox (out of scope for this sprint).
 *
 * Compatible with: jest@29, Expo SDK 54, RN 0.81, New Architecture.
 */

import type { Config } from 'jest';

const config: Config = {
  // ── Environment: pure Node (no JSDOM, no RN native mocks) ────────────────
  testEnvironment: 'node',

  // ── Transform: strip TypeScript via babel-preset-expo ────────────────────
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': [
      'babel-jest',
      { configFile: './babel.config.js' },
    ],
  },

  // ── Setup ─────────────────────────────────────────────────────────────────
  setupFilesAfterEnv: ['./jest-setup.ts'],

  // ── Module resolution ─────────────────────────────────────────────────────
  moduleNameMapper: {
    // @/ path alias — matches tsconfig.json paths
    '^@/(.*)$': '<rootDir>/$1',
    // Stub out native/image assets that Jest can't process
    '\\.(png|jpg|jpeg|gif|svg|ttf|woff|woff2)$': '<rootDir>/jest-fileMock.js',
  },

  // ── Transform ignore ──────────────────────────────────────────────────────
  // Packages that ship ESM and must be transpiled.
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      'expo' +
      '|expo-constants' +
      '|expo-modules-core' +
      '|@expo/.*' +
      '|zustand' +
      '|zod' +
      ')/)',
  ],

  // ── Test scope ────────────────────────────────────────────────────────────
  // Only run pure logic tests — no native UI component tests.
  testMatch: [
    '**/utils/__tests__/**/*.test.ts',
    '**/stores/__tests__/**/*.test.ts',
    '**/api/__tests__/**/*.test.ts',
    '**/hooks/__tests__/**/*.test.ts',
  ],

  // ── Coverage ──────────────────────────────────────────────────────────────
  collectCoverageFrom: [
    'utils/**/*.ts',
    'stores/**/*.ts',
    'api/**/*.ts',
    'hooks/**/*.ts',
    '!**/__tests__/**',
    '!**/mock.ts',
    '!**/mockOrders.ts',
  ],
  coverageReporters: ['text', 'lcov', 'json-summary'],

  testTimeout: 15000,
  verbose: true,
};

export default config;
