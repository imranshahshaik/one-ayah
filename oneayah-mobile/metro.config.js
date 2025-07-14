const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure proper module resolution for SDK 53
config.resolver.alias = {
  ...config.resolver.alias,
};

module.exports = config;