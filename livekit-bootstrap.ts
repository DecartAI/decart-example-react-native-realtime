// Registers LiveKit's native WebRTC globals before any realtime code runs.
//
// The Decart SDK reads the WebRTC globals (RTCPeerConnection, MediaStream, ...)
// that LiveKit installs, so `registerGlobals()` MUST run before the app / any
// module that touches realtime is imported. See index.js — this file is imported
// first, before `./App`.
import { registerGlobals } from '@livekit/react-native';

registerGlobals();
