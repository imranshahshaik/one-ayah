const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Optimize bundle loading and performance
config.resolver.platforms = ['ios', 'android', 'native', 'web'];
config.transformer.minifierConfig = {
  ecma: 8,
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

module.exports = config;