import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Chip, Stepper } from '../components/ui';
import { GROUPS, Group } from '../lib/data';
import { fmt, C } from '../lib/theme';
import { useStore } from '../lib/store';

const LIMITS = [120, 180, 240, 300, 360];

export default function Setup() {
  const router = useRouter();
  const { state, update } = useStore();
  const [name, setName] = useState(state.name);
  const [email, setEmail] = useState(state.email);
  const [limit, setLimit] = useState(state.goals.dailyLimitMin);
  const [ns, setNs] = useState(state.nightStart);
  const [ne, setNe] = useState(state.nightEnd);
  const [mon, setMon] = useState<Group[]>(state.monitored);
  const toggle = (g: Group) => setMon((m) => (m.includes(g) ? m.filter((x) => x !== g) : [...m, g]));
  const valid = name.trim().length > 1 && mon.length > 0;
  const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
        <Text style={s.h}>Configura tu perfil</Text>
        <Text style={s.p}>Cuéntanos sobre ti para personalizar tu experiencia.</Text>
        <Card style={{ marginTop: 14, gap: 10 }}>
          <Text style={s.t}>Información personal</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Nombre" style={s.input} placeholderTextColor="#94A3B8" />
          <TextInput value={email} onChangeText={setEmail} placeholder="Correo electrónico (opcional)" autoCapitalize="none" keyboardType="email-address" style={s.input} placeholderTextColor="#94A3B8" />
        </Card>
        <Card style={{ marginTop: 12 }}>
          <Text style={s.t}>Meta diaria de uso</Text>
          <Text style={s.p}>Tiempo objetivo de uso de pantalla por día</Text>
          <View style={s.wrapRow}>
            {LIMITS.map((l) => <Chip key={l} label={fmt(l)} active={limit === l} onPress={() => setLimit(l)} />)}
          </View>
        </Card>
        <Card style={{ marginTop: 12 }}>
          <Text style={s.t}>Reducir uso nocturno</Text>
          <Text style={s.p}>Define tu horario de descanso digital</Text>
          <View style={[s.wrapRow, { justifyContent: 'space-between', marginTop: 10 }]}>
            <View><Text style={s.sm}>Desde</Text><Stepper value={ns} onChange={setNs} min={18} max={23} format={hh} /></View>
            <View><Text style={s.sm}>Hasta</Text><Stepper value={ne} onChange={setNe} min={4} max={10} format={hh} /></View>
          </View>
        </Card>
        <Card style={{ marginTop: 12 }}>
          <Text style={s.t}>Categorías de uso</Text>
          <Text style={s.p}>Selecciona las categorías que quieres monitorear</Text>
          <View style={s.wrapRow}>
            {GROUPS.map((g) => <Chip key={g} label={g} active={mon.includes(g)} onPress={() => toggle(g)} />)}
          </View>
        </Card>
        <View style={{ marginTop: 18 }}>
          <Button
            label="Continuar"
            icon="arrow-forward"
            disabled={!valid}
            onPress={() => {
              update({
                name: name.trim(),
                email: email.trim(),
                nightStart: ns,
                nightEnd: ne,
                monitored: mon,
                goals: { ...state.goals, dailyLimitMin: limit },
                onboarded: true,
              });
              router.replace('/(tabs)');
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 20, maxWidth: 560, width: '100%', alignSelf: 'center' },
  h: { fontSize: 26, fontWeight: '800', color: C.text },
  p: { color: C.muted, fontSize: 13, marginTop: 2 },
  t: { fontWeight: '700', color: C.text, fontSize: 15 },
  sm: { color: C.muted, fontSize: 12, marginBottom: 4 },
  input: { height: 46, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, backgroundColor: '#fff', color: C.text, fontSize: 15 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
});
