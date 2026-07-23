import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MediaStream, RTCView } from '@livekit/react-native-webrtc';
import type { FacingMode } from './media-streams';
import type { ConnectionState } from './useWebRTC';

interface Props {
  facingMode: FacingMode;
  localMediaStream: MediaStream | null;
  remoteMediaStream: MediaStream | null;
  isConnecting: boolean;
  connectionState: ConnectionState;
}

// Fullscreen transformed (remote) stream, with the raw camera in a small PiP.
// Before the remote stream arrives, the local camera fills the screen.
export function VideoRenderer({
  facingMode,
  localMediaStream,
  remoteMediaStream,
  isConnecting,
  connectionState,
}: Props) {
  const showFullScreenLocal = !remoteMediaStream;
  const showLoading = showFullScreenLocal && isConnecting;

  if (!localMediaStream && !remoteMediaStream) {
    return <View style={styles.container} />;
  }

  const fullScreenURL = showFullScreenLocal
    ? localMediaStream?.toURL()
    : remoteMediaStream?.toURL();

  return (
    <View style={styles.container}>
      {fullScreenURL ? (
        <RTCView
          mirror={facingMode === 'user'}
          objectFit="cover"
          streamURL={fullScreenURL}
          zOrder={0}
          style={styles.video}
        />
      ) : null}

      {/* Raw camera PiP once the transformed stream is showing */}
      {!showFullScreenLocal && localMediaStream ? (
        <View style={styles.pip}>
          <RTCView
            mirror={facingMode === 'user'}
            objectFit="cover"
            streamURL={localMediaStream.toURL()}
            zOrder={1}
            style={styles.video}
          />
        </View>
      ) : null}

      {showLoading ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <Text style={styles.loadingText}>
            {connectionState === 'reconnecting'
              ? 'Reconnecting…'
              : 'Warming up…'}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  video: { flex: 1, width: '100%', height: '100%' },
  pip: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    width: '32%',
    aspectRatio: 9 / 16,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
