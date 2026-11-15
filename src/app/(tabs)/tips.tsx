import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, IconBadge } from '../../components/ui';
import { C } from '../../lib/theme';
import { useStore } from '../../lib/store';

const tones = {
  purple: [C.purple, C.purpleSoft],
  orange: [C.orange, C.orangeSoft],
  green: [C.green, C.greenSoft],
  blue: [C.blue, C.blueSoft],
  amber: [C.amber, C.amberSoft],
} as const;

export default function Tips() {
  const router = useRouter();
  const { tips, alertList } = useStore();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={s.wrap}>
        <Text style={s.h}>Recomendaciones</Text>
        <Text style={s.p}>Sugerencias para mejorar tu bienestar digital según tu uso de hoy.</Text>
        {alertList.length > 0 && (
          <Pressable onPress={() => router.push('/alerts')}>
            <Card style={{ marginTop: 12, backgroundColor: C.amberSoft, borderColor: '#FDE68A', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="notifications" size={22} color={C.amber} />
              <Text style={{ flex: 1, fontWeight: '700', color: C.text }}>Tienes {alertList.length} alerta{alertList.length > 1 ? 's' : ''} activa{alertList.length > 1 ? 's' : ''}</Text>
              <Ionicons name="chevron-forward" size={18} color={C.amber} />
            </Card>
          </Pressable>
        )}
        {tips.map((t) => {
          const [color, soft] = tones[t.tone];
          return (
            <Card key={t.id} style={{ marginTop: 12 }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <IconBadge name={t.icon} color={color} soft={soft} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', color: C.text, fontSize: 15 }}>{t.title}</Text>
                  <Text style={{ color: C.muted, fontSize: 13, marginTop: 3, lineHeight: 19 }}>{t.text}</Text>
                </View>
              </View>
              {t.id !== 'ok' && t.id !== 'progress' && (
                <Pressable onPress={() => router.push('/(tabs)/goals')} style={s.btn}>
                  <Text style={{ color: C.text, fontWeight: '700', fontSize: 13 }}>Ajustar mis metas</Text>
                </Pressable>
              )}
            </Card>
          );
        })}
        <Text style={{ color: C.muted, fontSize: 11, marginTop: 16 }}>FocusTracker orienta la autorregulación digital; no realiza diagnósticos clínicos ni bloquea aplicaciones.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 16, paddingBottom: 30, maxWidth: 640, width: '100%', alignSelf: 'center' },
  h: { fontSize: 24, fontWeight: '800', color: C.text },
  p: { color: C.muted, fontSize: 13, marginTop: 2 },
  btn: { marginTop: 12, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
});
