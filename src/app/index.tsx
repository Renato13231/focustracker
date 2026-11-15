import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/ui';
import { C } from '../lib/theme';
import { useStore } from '../lib/store';

export default function Welcome() {
  const { ready, state } = useStore();
  const router = useRouter();
  if (!ready) return null;
  if (state.onboarded && state.consent) return <Redirect href="/(tabs)" />;
  const feats = [
    ['stats-chart-outline', 'Entiende tu uso', 'Indicadores claros de tu tiempo digital.'],
    ['sparkles-outline', 'Clasificación con IA', 'Detecta si tu patrón es productivo, distractivo o de riesgo.'],
    ['bulb-outline', 'Recomendaciones', 'Sugerencias personalizadas, sin bloquear tus apps.'],
  ];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={s.wrap}>
        <View style={s.logo}>
          <Ionicons name="stats-chart" size={34} color="#fff" />
        </View>
        <Text style={s.title}>
          Focus<Text style={{ color: C.primary }}>Tracker</Text>
        </Text>
        <Text style={s.sub}>Comprende tu comportamiento digital y gestiona tu tiempo de forma consciente.</Text>
        <View style={{ gap: 12, marginVertical: 28, width: '100%' }}>
          {feats.map(([i, t, d]) => (
            <View key={t} style={s.feat}>
              <View style={s.fi}><Ionicons name={i as any} size={22} color={C.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: C.text, fontSize: 15 }}>{t}</Text>
                <Text style={{ color: C.muted, fontSize: 13 }}>{d}</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={{ width: '100%' }}>
          <Button label="Comenzar" icon="arrow-forward" onPress={() => router.push('/consent')} />
        </View>
        <Text style={s.foot}>Proyecto de título · Ingeniería en Computación e Informática · Universidad Andrés Bello</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 24, alignItems: 'center', justifyContent: 'center', flexGrow: 1, maxWidth: 520, width: '100%', alignSelf: 'center' },
  logo: { width: 72, height: 72, borderRadius: 22, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontSize: 34, fontWeight: '800', color: C.text },
  sub: { fontSize: 16, color: C.muted, textAlign: 'center', marginTop: 8, lineHeight: 23 },
  feat: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: C.border },
  fi: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#CCFBF1', alignItems: 'center', justifyContent: 'center' },
  foot: { marginTop: 22, fontSize: 11, color: C.muted, textAlign: 'center' },
});
