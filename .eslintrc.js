/**
 * .eslintrc.js — ESLint configuration for AITS Shop
 *
 * Enforces:
 *  - TypeScript strict rules (@typescript-eslint)
 *  - React best practices (react, react-hooks)
 *  - React Native patterns (react-native)
 *  - No 'any' types (enforced with error — project requirement)
 *  - Consistent import ordering
 */

module.exports = {
  root: true,

  // ── Parsers & settings ────────────────────────────────────────────────────
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    // Point to tsconfig for type-aware rules
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },

  // ── Environments ──────────────────────────────────────────────────────────
  env: {
    browser: false,
    node: true,
    es2022: true,
    'react-native/react-native': true,
    jest: true,
  },

  // ── Settings ──────────────────────────────────────────────────────────────
  settings: {
    react: {
      version: 'detect',
    },
  },

  // ── Plugins ───────────────────────────────────────────────────────────────
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'react-native',
  ],

  // ── Extends ───────────────────────────────────────────────────────────────
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react-native/all',
  ],

  // ── Rules ─────────────────────────────────────────────────────────────────
  rules: {
    // ── TypeScript — core requirements ──────────────────────────────────────
    '@typescript-eslint/no-explicit-any': 'error',               // PROJECT REQUIREMENT: no any
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-call': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
    '@typescript-eslint/no-unsafe-return': 'warn',
    '@typescript-eslint/no-unsafe-argument': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',   // too noisy for components
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    }],
    '@typescript-eslint/consistent-type-imports': ['error', {
      prefer: 'type-imports',
      fixStyle: 'inline-type-imports',
    }],
    '@typescript-eslint/no-floating-promises': 'error',          // always await or handle promises
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-misused-promises': 'error',

    // ── React ─────────────────────────────────────────────────────────────
    'react/react-in-jsx-scope': 'off',    // RN 0.71+ / React 17+: no import needed
    'react/prop-types': 'off',            // TypeScript handles this
    'react/display-name': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // ── React Native ──────────────────────────────────────────────────────
    'react-native/no-unused-styles': 'error',
    'react-native/split-platform-components': 'warn',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'off',   // we use our colors constant

    // ── General code quality ──────────────────────────────────────────────
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }], // allow structured logging
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
  },

  // ── Per-file overrides ────────────────────────────────────────────────────
  overrides: [
    {
      // Test files: relax some rules
      files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}', 'jest-setup.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',     // mocks often need any
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        'no-console': 'off',
      },
    },
    {
      // Config files (babel, jest) — CommonJS, not ESM
      files: ['babel.config.js', 'jest.config.ts', '*.config.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    {
      // Mock files
      files: ['api/mock.ts', 'api/mockOrders.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
      },
    },
  ],

  // ── Ignore patterns ───────────────────────────────────────────────────────
  ignorePatterns: [
    'node_modules/',
    '.expo/',
    'dist/',
    'web-build/',
    'android/',
    'ios/',
    'coverage/',
    '*.tsbuildinfo',
  ],
};
