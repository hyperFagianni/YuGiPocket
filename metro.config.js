const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Il campo "exports" di alcuni package del SDK Firebase (usato dalla bacheca di scambio online)
// confonde la risoluzione moduli di Metro su Expo SDK 53+, causando in runtime l'errore
// "Component auth has not been registered yet". Vedi https://github.com/expo/expo/issues/36588
config.resolver.unstable_enablePackageExports = false;
config.resolver.sourceExts.push('cjs');

module.exports = config;
