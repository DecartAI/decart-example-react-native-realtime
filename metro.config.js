const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * ⚠️ This project is intentionally BROKEN in this commit to reproduce the errors
 * a bare React Native app hits with the Decart realtime + LiveKit stack. See the
 * next commit for the fix and README.md for the explanation.
 *
 * Below is a stale `livekit-client` override — the kind of copy-pasted workaround
 * from when livekit-client shipped `dist/livekit-client.esm.js`. livekit-client
 * 2.x ships `dist/livekit-client.esm.mjs`, so this points at a file that no longer
 * exists and Metro fails with:
 *   "Unable to resolve module .../livekit-client/dist/livekit-client.esm"
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === 'livekit-client') {
        return context.resolveRequest(
          context,
          './node_modules/livekit-client/dist/livekit-client.esm',
          platform,
        );
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
