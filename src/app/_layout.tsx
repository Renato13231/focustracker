import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider } from '../lib/store';

export default function RootLayout() {
  return (
    <StoreProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F4F8FB' } }}>
        <Stack.Screen name="alerts" options={{ presentation: 'modal' }} />
      </Stack>
    </StoreProvider>
  );
}
