// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Custom block list to ignore temporary files and directories created by npm/jest/IDE in node_modules.
// This prevents Metro from crashing with ENOENT errors on Windows.
const customBlockList = [
  /[\\/]node_modules[\\/]\.jest-expo-/,
  /[\\/]node_modules[\\/]\.json-schema-/,
  /[\\/]node_modules[\\/]\.cache[\\/]/,
  /istanbul-lib-instrument/,
];

if (config.resolver.blockList) {
  if (Array.isArray(config.resolver.blockList)) {
    config.resolver.blockList = [...config.resolver.blockList, ...customBlockList];
  } else {
    const originalBlockList = config.resolver.blockList;
    config.resolver.blockList = {
      test: (path) => {
        if (customBlockList.some(regex => regex.test(path))) {
          return true;
        }
        if (originalBlockList && typeof originalBlockList.test === 'function') {
          return originalBlockList.test(path);
        }
        if (typeof originalBlockList === 'function') {
          return originalBlockList(path);
        }
        return false;
      }
    };
  }
} else {
  config.resolver.blockList = customBlockList;
}

module.exports = config;
