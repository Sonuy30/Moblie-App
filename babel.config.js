/**
 * babel.config.js — Babel config for Expo SDK 54 + Jest
 *
 * 'babel-preset-expo' handles:
 *  - TypeScript stripping
 *  - React JSX transform
 *  - React Native specific transforms
 *  - Module aliasing (via babel-plugin-module-resolver for @/ paths)
 *
 * This file is used by:
 *  - Metro (app bundler during development)
 *  - babel-jest (test transformer during CI)
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Map @/* to project root — mirrors tsconfig.json paths
      [
        'module-resolver',
        {
          root: ['./'],
          alias: { '@': './' },
          extensions: ['.ios.ts', '.android.ts', '.ts', '.tsx', '.js', '.jsx', '.json'],
        },
      ],
      // Required for react-native-reanimated (must be listed last)
      'react-native-reanimated/plugin',
    ],
  };
};
