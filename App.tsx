/**
 * Decart Realtime — bare React Native (CLI) example.
 *
 * Mirrors decart-example-expo-realtime, but on a plain React Native project so
 * it can be used as a starting point outside Expo. The realtime integration is
 * identical to the web/Expo SDK usage (see src/useWebRTC.ts).
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  PermissionsAndroid,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { models, type ModelDefinition } from '@decartai/sdk';
import { useWebRTC } from './src/useWebRTC';
import { VideoRenderer } from './src/VideoRenderer';
import type { FacingMode } from './src/media-streams';

const MODEL_IDS = ['lucy-restyle-2', 'lucy-2.5'] as const;

async function ensureCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    // iOS prompts on first getUserMedia via the Info.plist usage strings.
    return true;
  }
  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CAMERA,
  );
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

function App(): React.JSX.Element {
  const [modelId, setModelId] =
    useState<(typeof MODEL_IDS)[number]>('lucy-restyle-2');
  const [facingMode] = useState<FacingMode>('user');
  const [hasPermission, setHasPermission] = useState(false);

  const {
    localMediaStream,
    remoteMediaStream,
    isConnecting,
    connectionState,
    connect,
    disconnect,
  } = useWebRTC();

  useEffect(() => {
    ensureCameraPermission().then(setHasPermission);
  }, []);

  const isLive = connectionState !== 'disconnected';

  const handleToggle = useCallback(async () => {
    if (isLive) {
      disconnect();
      return;
    }
    const granted = await ensureCameraPermission();
    setHasPermission(granted);
    if (!granted) return;
    const model: ModelDefinition = models.realtime(modelId);
    await connect({ model, facingMode });
  }, [isLive, disconnect, connect, modelId, facingMode]);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" />
      <View style={styles.videoArea}>
        <VideoRenderer
          facingMode={facingMode}
          localMediaStream={localMediaStream}
          remoteMediaStream={remoteMediaStream}
          isConnecting={isConnecting}
          connectionState={connectionState}
        />
      </View>

      <View style={styles.controls}>
        <View style={styles.modelRow}>
          {MODEL_IDS.map(id => (
            <Pressable
              key={id}
              disabled={isLive}
              onPress={() => setModelId(id)}
              style={[
                styles.chip,
                modelId === id && styles.chipActive,
                isLive && styles.chipDisabled,
              ]}>
              <Text
                style={[
                  styles.chipText,
                  modelId === id && styles.chipTextActive,
                ]}>
                {id}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={handleToggle}
          style={[styles.cta, isLive ? styles.ctaStop : styles.ctaStart]}>
          <Text style={styles.ctaText}>
            {isLive
              ? `Stop (${connectionState})`
              : hasPermission
              ? 'Start realtime'
              : 'Grant camera & start'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  videoArea: { flex: 1 },
  controls: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
    backgroundColor: '#0a0a0a',
  },
  modelRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  chipActive: { backgroundColor: '#fff', borderColor: '#fff' },
  chipDisabled: { opacity: 0.4 },
  chipText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  chipTextActive: { color: '#000', fontWeight: '600' },
  cta: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  ctaStart: { backgroundColor: '#4f46e5' },
  ctaStop: { backgroundColor: '#b91c1c' },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default App;
