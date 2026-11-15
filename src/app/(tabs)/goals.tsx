import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, IconBadge, Progress, Stepper } from '../../components/ui';
import { Goals } from '../../lib/analysis';
import { C, fmt } from '../../lib/theme';
import { useStore } from '../../lib/store';

export default function GoalsScreen() {
  const { state, update, today, last7, days, config } = useStore();
  const g = state.goals;
  const set = (patch: Partial<Goals>) => update({ goals: { ...g, ...patch } });
  if (!today) return null;
  const defs: { key: keyof Goals; icon: string; color: string; soft: string; title: string; desc: string; step: number; min: number; max: number; fmt: (v: number) => string }[] = [
    { key: 'dailyLimitMin', icon: 'time-outline', color: C.blue, soft: C.blueSoft, title: 'Tiempo total diario', desc: 'Máximo de uso de pantalla por día', step: 30, min: 30, max: 720, fmt },
    { key: 'maxDistractiveMin', icon: 'phone-portrait-outline', color: C.orange, soft: C.orangeSoft, title: 'Tiempo distractivo', desc: 'Máximo en apps distractivas', step: 15, min: 15, max: 360, fmt },
    { key: 'maxNightMin', icon: 'moon-outline', color: C.purple, soft: C.purpleSoft, title: 'Uso nocturno', desc: `Máximo entre ${config.nightStart}:00 y ${String(config.nightEnd).padStart(2, '0')}:00`, step: 10, min: 0, max: 180, fmt },
    { key: 'minProductivePct', icon: 'rocket-outline', color: C.green, soft: C.greenSoft, title: 'Uso productivo', desc: 'Mínimo de uso productivo', step: 5, min: 5, max: 90, fmt: (v) => `${v}%` },
  ];
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={s.wrap}>
        <Text style={s.h}>Metas personales</Text>
        <Text style={s.p}>Define metas progresivas. Hoy cumples {today.goals.filter((x) => x.ok).length} de {today.goals.length}.</Text>
        {defs.map((d) => {
          const res = today.goals.find((x) => x.key === d.key)!;
          const week = last7.filter((day) => day.goals.find((x) => x.key === d.key)!.ok).length;
          const pct = d.key === 'minProductivePct' ? (res.value / res.target) * 100 : (res.value / res.target) * 100;
          const barColor = res.ok ? C.green : C.red;
          return (
            <Card key={d.key} style={{ marginTop: 12 }}>
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <IconBadge name={d.icon} color={d.color} soft={d.soft} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', color: C.text, fontSize: 15 }}>{d.title}</Text>
                  <Text style={{ color: C.muted, fontSize: 12 }}>{d.desc}</Text>
                </View>
                <Ionicons name={res.ok ? 'checkmark-circle' : 'close-circle'} size={24} color={barColor} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, marginBottom: 6 }}>
                <Text style={{ color: C.text, fontSize: 13 }}>Hoy: <Text style={{ fontWeight: '800' }}>{d.fmt(res.value)}</Text></Text>
                <Text style={{ color: C.muted, fontSize: 12 }}>Cumplida {week}/{last7.length} días</Text>
              </View>
              <Progress pct={Math.min(100, pct)} color={barColor} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <Text style={{ color: C.muted, fontSize: 12 }}>Meta</Text>
                <Stepper value={g[d.key]} step={d.step} min={d.min} max={d.max} format={d.fmt} onChange={(v) => set({ [d.key]: v } as Partial<Goals>)} />
              </View>
            </Card>
          );
        })}
        <Text style={{ color: C.muted, fontSize: 12, marginTop: 14 }}>Cumplimiento promedio de los últimos 7 días: {Math.round(last7.reduce((a, d) => a + d.goalCompliance, 0) / Math.max(1, last7.length))}% · {days.length} días de historial</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 16, paddingBottom: 30, maxWidth: 640, width: '100%', alignSelf: 'center' },
  h: { fontSize: 24, fontWeight: '800', color: C.text },
  p: { color: C.muted, fontSize: 13, marginTop: 2 },
});
