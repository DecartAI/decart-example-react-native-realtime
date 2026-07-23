/**
 * @format
 */

// IMPORTANT: bootstrap LiveKit's native WebRTC globals *before* the app (and the
// Decart SDK) load. This must be the first import in the entry file.
import './livekit-bootstrap';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
