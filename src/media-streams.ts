import { mediaDevices } from '@livekit/react-native-webrtc';

export type FacingMode = 'user' | 'environment';

export function getMediaStreamConstraints(
  facingMode: FacingMode,
  { fps, width, height }: { fps: number; width: number; height: number },
) {
  return {
    audio: false,
    video: {
      frameRate: fps,
      facingMode,
      width,
      height,
    },
  };
}

// Capture the device camera through LiveKit's WebRTC layer, sized from the model.
export async function getMediaStream(
  facingMode: FacingMode = 'user',
  { fps, width, height }: { fps: number; width: number; height: number },
) {
  return mediaDevices.getUserMedia(
    getMediaStreamConstraints(facingMode, { fps, width, height }),
  );
}
