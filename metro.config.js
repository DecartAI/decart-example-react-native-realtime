const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * Notes for the Decart realtime stack on bare React Native:
 *
 *  - DO NOT alias `livekit-client` to a hard-coded file such as
 *    `node_modules/livekit-client/dist/livekit-client.esm`. That file does not
 *    exist in livekit-client >= 2.x (it ships `livekit-client.esm.mjs`), and a
 *    stale alias is the cause of:
 *      "Unable to resolve module .../livekit-client/dist/livekit-client.esm".
 *    Let Metro resolve the package via its "exports" map (on by default in
 *    RN 0.81+) — no alias needed.
 *
 *  - `mjs`/`cjs` are added to sourceExts defensively so `.mjs`/`.cjs` files in
 *    dependencies resolve regardless of how they're referenced.
 *
 * The other half of the setup (zod's ESM `export * as` syntax) is handled in
 * babel.config.js via @babel/plugin-transform-export-namespace-from.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    sourceExts: [...defaultConfig.resolver.sourceExts, 'mjs', 'cjs'],
  },
};

module.exports = mergeConfig(defaultConfig, config);
