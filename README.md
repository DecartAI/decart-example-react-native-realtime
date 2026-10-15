# Decart Realtime — bare React Native (CLI) example

A **plain React Native (CLI)** app demonstrating [Decart's](https://decart.ai) Realtime
Video models — the non-Expo counterpart to
[`decart-example-expo-realtime`](https://github.com/DecartAI/decart-example-expo-realtime).

The realtime integration (creating a client, capturing the camera, connecting to a
model, rendering the transformed stream) is **identical to the web/Expo SDK usage**.
The only meaningful difference between Expo and bare React Native is **Metro/Babel
configuration** — see [React Native CLI gotchas](#react-native-cli-bare-gotchas) below,
which is the whole reason this example exists.

> 💡 The first commit in this repo is intentionally **broken** (it reproduces the
> failures below); the second commit is the **fix**. Diff them to see exactly what
> changed.

Stack (matches the Expo example):

```json
{
  "@decartai/sdk": "0.2.11",
  "livekit-client": "2.20.1",
  "@livekit/react-native": "2.11.1",
  "@livekit/react-native-webrtc": "144.1.1",
  "react-native": "0.82.1"
}
```

## Prerequisites

- Node 20+
- Xcode + CocoaPods (iOS) and/or Android Studio (Android)
- A physical device, or the iOS Simulator with the bundled-video patch (see
  [Running on the iOS Simulator](#running-on-the-ios-simulator))
- A Decart API key from [platform.decart.ai](https://platform.decart.ai)

## Setup

```bash
npm install   # also applies patches/ via patch-package (postinstall)

# iOS native deps
cd ios && bundle install && bundle exec pod install && cd ..
```

Add your API key in `src/config.ts` (for production, mint
[client tokens](https://docs.platform.decart.ai/getting-started/client-tokens)
server-side instead of shipping a raw key):

```ts
export const DECART_API_KEY = 'sk-...';
```

Run on a connected device:

```bash
npm run ios      # or: npm run android
```

## How it works

- `livekit-bootstrap.ts` — calls `registerGlobals()` from `@livekit/react-native`.
  This installs the WebRTC globals the Decart SDK relies on and **must run before the
  app loads**, so it is the very first import in `index.js`.
- `src/media-streams.ts` — captures the camera via LiveKit's `mediaDevices.getUserMedia`.
- `src/useWebRTC.ts` — the core Decart lifecycle: `createDecartClient` →
  `getMediaStream` → `client.realtime.connect(stream, { model, onRemoteStream, onConnectionChange })`.
  The loading state ends on `connectionChange === "generating"` (the server produced
  its first transformed frame), not when a remote stream object appears: `connected`
  only means the room was joined and the camera track published.
- `src/VideoRenderer.tsx` — renders local + remote streams with `RTCView`.
- `App.tsx` — camera permission, a model selector, and a start/stop button.

## Running on the iOS Simulator

The simulator has no camera. `@livekit/react-native-webrtc` creates the video track
there with no capturer attached, so no frames go up, the server never starts
generating, and no video comes back.

This example patches `@livekit/react-native-webrtc` (see
`patches/@livekit+react-native-webrtc+144.1.1.patch`, applied by `patch-package` on
`npm install`) so that **on the simulator only**, `getUserMedia({ video })` returns
a track fed from a video file bundled in the app, using WebRTC's
`RTCFileVideoCapturer`. Device builds are unchanged and still use the camera. The
JavaScript side and the Decart SDK calls are the same on both.

What the patch does, in `ios/RCTWebRTC/`:

- `WebRTCModule+RTCMediaStream.m` `createVideoTrack`: adds an `#else` branch to the
  existing `#if !TARGET_IPHONE_SIMULATOR` camera block that attaches a
  `FileCaptureController`.
- `FileCaptureController.{h,m}` (new): wraps `RTCFileVideoCapturer`, loops
  `simulator-input.mp4` from the main bundle, reports the clip's width/height/frame
  rate in the track settings (LiveKit needs them to publish), and converts frames to
  I420 so the local `RTCView` preview renders on the simulator.

To use your own clip, replace `ios/DecartRealtimeRN/simulator-input.mp4` (keep the
name, or change `kFileCaptureFileName` in the patch). It must be in the app target's
**Copy Bundle Resources**, and the file name must contain exactly one dot. A short
H.264 clip of a person facing the camera works best for most models.

To bring the patch into another app: copy the `patches/` file, add `patch-package`
and `"postinstall": "patch-package"`, pin `@livekit/react-native-webrtc` to the
exact version the patch was made against (`144.1.1` here), add the clip to your app
bundle, then `pod install` and rebuild.

## React Native CLI (bare) gotchas

> This is the important part. On a **bare RN 0.82 project** (Metro 0.83, package
> `exports` resolution **on** by default), the Decart SDK will not bundle until you
> apply the two fixes below. Expo's Metro config handles both for you, which is why
> the same code "just works" under Expo.

### 1. `zod` ESM syntax → add a Babel plugin

The SDK depends on `zod`, whose ESM build uses `export * as ns from '...'`. Metro's
default CommonJS transform can't lower that and fails with:

```
error node_modules/zod/v4/classic/external.js: Export namespace should be first
transformed by `@babel/plugin-transform-export-namespace-from`.
```

**Fix** — `babel.config.js`:

```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ['@babel/plugin-transform-export-namespace-from'],
};
```

(and `npm install --save-dev @babel/plugin-transform-export-namespace-from`)

### 2. Do NOT hard-code the `livekit-client` path in `metro.config.js`

`livekit-client@2.x` ships its ESM build as **`dist/livekit-client.esm.mjs`**. Older
setups (and copy-pasted workarounds) sometimes alias the package to the *extensionless*
`dist/livekit-client.esm`, which used to exist. With livekit-client 2.20.1 that file is
gone, so Metro fails at connect time with:

```
Unable to resolve module .../livekit-client/dist/livekit-client.esm
None of these files exist:
  * .../livekit-client/dist/livekit-client.esm(.ios.js|.native.js|.js|...|.tsx)
```

Because the SDK loads LiveKit lazily (`import("livekit-client")` only when realtime
connects), this surfaces at runtime as
`[DecartSDK] realtime connect: exhausted all retries` /
`signaling: websocket closed` — **not** as a startup crash, which makes it look like a
network problem when it is really a bundler problem.

**Fix** — remove any `resolver.extraNodeModules` / `resolver.resolveRequest` entry that
points `livekit-client` at a specific file. Let Metro resolve it via the package's
`exports` map. This example's `metro.config.js` only adds `mjs`/`cjs` to `sourceExts`
defensively:

```js
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const defaultConfig = getDefaultConfig(__dirname);

module.exports = mergeConfig(defaultConfig, {
  resolver: {
    sourceExts: [...defaultConfig.resolver.sourceExts, 'mjs', 'cjs'],
  },
});
```

### Verify without a device

Both fixes are verifiable offline — the failure is at bundle time:

```bash
npx react-native bundle --platform ios --dev false \
  --entry-file index.js --bundle-output /tmp/out.jsbundle --reset-cache
```

A clean exit means the SDK + livekit-client resolved and transformed correctly.

## Notes

- `mirror`, `debugQuality`, and the deep connectivity preflight
  (`checkConnectivity()`) are **browser-only** and reject with
  `UNSUPPORTED_PLATFORM_FEATURE` on React Native. Mirror the local preview with
  `<RTCView mirror>` instead (done in `VideoRenderer.tsx`).
- Native camera capture uses **VP8** (`preferredVideoCodec: "vp8"`).

## Resources

- [Realtime Mobile App walkthrough](https://docs.platform.decart.ai/examples/real-time-mobile-app)
- [JavaScript SDK — Realtime](https://docs.platform.decart.ai/sdks/javascript-realtime)
- [Expo example](https://github.com/DecartAI/decart-example-expo-realtime)
