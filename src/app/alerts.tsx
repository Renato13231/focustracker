import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../components/ui';
import { C } from '../lib/theme';
import { useStore } from '../lib/store';

export default function Alerts() {
  const router = useRouter();
  const { alertList } = useStore();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 16, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: C.text }}>Alertas inteligentes</Text>
          <Pressable onPress={() => router.back()} accessibilityLabel="Cerrar"><Ionicons name="close" size={26} color={C.text} /></Pressable>
        </View>
        <Text style={{ color: C.muted, marginBottom: 12, fontSize: 13 }}>Avisos preventivos para que tomes conciencia. FocusTracker nunca bloquea tus aplicaciones.</Text>
        {alertList.length === 0 && (
          <Card style={{ alignItems: 'center', padding: 24 }}>
            <Ionicons name="checkmark-circle" size={40} color={C.green} />
            <Text style={{ fontWeight: '700', color: C.text, marginTop: 8 }}>Sin alertas por ahora</Text>
            <Text style={{ color: C.muted, marginTop: 2 }}>No se detectaron comportamientos de riesgo hoy.</Text>
          </Card>
        )}
        {alertList.map((a) => {
          const hi = a.severity === 'alta';
          return (
            <Card key={a.id} style={{ marginBottom: 10, flexDirection: 'row', gap: 12, backgroundColor: hi ? C.redSoft : C.amberSoft, borderColor: hi ? '#FECACA' : '#FDE68A' }}>
              <Ionicons name={hi ? 'warning' : 'alert-circle'} size={24} color={hi ? C.red : C.amber} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', color: C.text }}>{a.title}</Text>
                <Text style={{ color: C.text, fontSize: 13, marginTop: 2 }}>{a.text}</Text>
                <Text style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>Prioridad {a.severity}</Text>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
