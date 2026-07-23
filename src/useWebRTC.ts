import { useCallback, useRef, useState } from 'react';
import {
  createDecartClient,
  type ModelDefinition,
  type RealTimeClient,
  resolveFpsNumber,
} from '@decartai/sdk';
import type { MediaStream } from '@livekit/react-native-webrtc';
import { getMediaStream, type FacingMode } from './media-streams';
import { DECART_API_KEY } from './config';

export type ConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'failed';

// Core Decart realtime lifecycle: create a client, capture the camera, connect
// to a realtime model, expose the local + remote streams, and clean up.
export function useWebRTC() {
  const [localMediaStream, setLocalMediaStream] = useState<MediaStream | null>(
    null,
  );
  const [remoteMediaStream, setRemoteMediaStream] =
    useState<MediaStream | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('disconnected');

  const realtimeClientRef = useRef<RealTimeClient | null>(null);
  // Guards against races when the user reconnects / switches camera mid-connect.
  const connectionGenerationRef = useRef(0);

  const connect = useCallback(
    async ({
      model,
      facingMode,
    }: {
      model: ModelDefinition;
      facingMode: FacingMode;
    }) => {
      const generation = ++connectionGenerationRef.current;

      try {
        const client = createDecartClient({ apiKey: DECART_API_KEY });

        const stream = await getMediaStream(facingMode, {
          fps: resolveFpsNumber(model.fps),
          width: model.width,
          height: model.height,
        });

        if (generation !== connectionGenerationRef.current) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        setLocalMediaStream(stream);
        setIsConnecting(true);
        setConnectionState('connecting');

        const realtimeClient = await client.realtime.connect<MediaStream>(
          stream,
          {
            model,
            // Native camera capture uses VP8. `mirror` is browser-only and
            // rejected on React Native — mirror the preview in the view instead.
            preferredVideoCodec: 'vp8',
            onRemoteStream: remote => {
              if (generation !== connectionGenerationRef.current) return;
              setRemoteMediaStream(remote);
              setIsConnecting(false);
              setConnectionState('connected');
            },
          },
        );

        if (generation !== connectionGenerationRef.current) {
          realtimeClient.disconnect();
          return;
        }

        realtimeClientRef.current = realtimeClient;
      } catch (error) {
        console.error('[example] realtime connect failed:', error);
        if (generation === connectionGenerationRef.current) {
          setIsConnecting(false);
          setConnectionState('failed');
        }
      }
    },
    [],
  );

  const disconnect = useCallback(() => {
    connectionGenerationRef.current += 1;
    setConnectionState('disconnected');
    realtimeClientRef.current?.disconnect();
    realtimeClientRef.current = null;
    localMediaStream?.getTracks().forEach(track => track.stop());
    setLocalMediaStream(null);
    setRemoteMediaStream(null);
    setIsConnecting(false);
  }, [localMediaStream]);

  return {
    localMediaStream,
    remoteMediaStream,
    isConnecting,
    connectionState,
    connect,
    disconnect,
  };
}
