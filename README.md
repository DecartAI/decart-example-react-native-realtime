# Decart Realtime — bare React Native (CLI) example

> ⚠️ **This commit is intentionally broken.** It reproduces the Metro/Babel
> failures a bare React Native (CLI) app hits with the Decart realtime + LiveKit
> stack. The **next commit** fixes it — diff the two commits to see exactly what
> to change.

A plain React Native (CLI) app demonstrating [Decart's](https://decart.ai)
Realtime Video models — the non-Expo counterpart to
[`decart-example-expo-realtime`](https://github.com/DecartAI/decart-example-expo-realtime).

## Reproduce the failures

```bash
npm install
npx react-native bundle --platform ios --dev false \
  --entry-file index.js --bundle-output /tmp/out.jsbundle --reset-cache
```

You will hit (in some order):

1. **`zod` ESM syntax** — `babel.config.js` is missing
   `@babel/plugin-transform-export-namespace-from`:
   ```
   error node_modules/zod/...: Export namespace should be first transformed by
   `@babel/plugin-transform-export-namespace-from`.
   ```

2. **stale `livekit-client` alias** in `metro.config.js` pointing at
   `dist/livekit-client.esm` (which no longer exists — 2.x ships
   `dist/livekit-client.esm.mjs`):
   ```
   Unable to resolve module .../livekit-client/dist/livekit-client.esm
   ```
   Because the SDK loads LiveKit lazily, in the running app this shows up as
   `[DecartSDK] realtime connect: exhausted all retries` /
   `signaling: websocket closed` — looking like a network problem when it is a
   bundler problem.

See the next commit for the fix.
