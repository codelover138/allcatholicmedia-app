import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * Human-readable device label sent as Sanctum's token name, so a member can tell
 * their sessions apart in Profile → Security ("iPhone 15", "Pixel 8", …).
 */
export function deviceName(): string {
  const model = Device.modelName || Device.deviceName;
  const os = Platform.select({ ios: 'iOS', android: 'Android', default: 'Web' });
  return model ? `${model} · ${os}` : `${os} app`;
}
