const { getDefaultConfig } = require('expo/metro-config');
const configureSdkMetro = require('./siebly-sdk.metro.cjs');

const config = getDefaultConfig(__dirname);

module.exports = configureSdkMetro(config, __dirname);
