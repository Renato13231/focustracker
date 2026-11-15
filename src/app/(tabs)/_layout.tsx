import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { C } from '../../lib/theme';
import { useStore } from '../../lib/store';

const tab = (name: string, title: string, icon: string) => (
  <Tabs.Screen
    key={name}
    name={name}
    options={{ title, tabBarIcon: ({ color, size }) => <Ionicons name={icon as any} size={size} color={color as string} /> }}
  />
);

export default function TabsLayout() {
  const { ready, state } = useStore();
  if (!ready) return null;
  if (!state.onboarded || !state.consent) return <Redirect href="/" />;
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: C.primary, tabBarInactiveTintColor: '#94A3B8', tabBarLabelStyle: { fontSize: 11, fontWeight: '600' } }}>
      {tab('index', 'Inicio', 'home-outline')}
      {tab('stats', 'Estadísticas', 'bar-chart-outline')}
      {tab('goals', 'Metas', 'flag-outline')}
      {tab('tips', 'Consejos', 'bulb-outline')}
      {tab('profile', 'Perfil', 'person-outline')}
    </Tabs>
  );
}
