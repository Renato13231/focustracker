import { Platform } from 'react-native';
import { requireNativeModule } from 'expo';

export interface RawInterval {
  package: string;
  label: string;
  category: number; // ApplicationInfo.CATEGORY_* (-1 = sin categoría)
  startMs: number;
  endMs: number;
}

interface Native {
  hasPermission(): boolean;
  openSettings(): void;
  queryIntervals(startMs: number, endMs: number): Promise<RawInterval[]>;
}

let native: Native | null = null;
if (Platform.OS === 'android') {
  try {
    native = requireNativeModule<Native>('UsageStats');
  } catch {
    native = null; // Expo Go o build sin el módulo
  }
}

export const isAvailable = () => native !== null;
export const hasPermission = () => (native ? native.hasPermission() : false);
export const openSettings = () => native?.openSettings();
export const queryIntervals = (startMs: number, endMs: number) => (native ? native.queryIntervals(startMs, endMs) : Promise.resolve([]));
