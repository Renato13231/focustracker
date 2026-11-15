import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Legend, StackedBars, dayLabel } from '../../components/charts';
import { Card, Chip } from '../../components/ui';
import { DayKpis, patternStyle } from '../../lib/analysis';
import { C, fmt } from '../../lib/theme';
import { useStore } from '../../lib/store';

const avg = (ds: DayKpis[], f: (d: DayKpis) => number) => (ds.length ? ds.reduce((a, d) => a + f(d), 0) / ds.length : 0);

const longDate = (iso: string) => {
  const t = new Date(iso + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export default function Stats() {
  const { days, classOf } = useStore();
  const [mode, setMode] = useState<'daily' | 'weekly'>('daily');
  const [sel, setSel] = useState<string | null>(null);
  if (!days.length) return null;
  const last14 = days.slice(-14);
  const selected = days.find((d) => d.day === (sel ?? days[days.length - 1].day))!;
  const cls = classOf(selected);
  const ps = patternStyle[cls.label];

  const weeks = [3, 2, 1, 0].map((i) => days.slice(days.length - 7 * (i + 1), days.length - 7 * i)).filter((w) => w.length);
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={s.wrap}>
        <Text style={s.h}>Historial de comportamiento</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginVertical: 12 }}>
          <Chip label="Diario" active={mode === 'daily'} onPress={() => setMode('daily')} />
          <Chip label="Semanal" active={mode === 'weekly'} onPress={() => setMode('weekly')} />
        </View>

        {mode === 'daily' ? (
          <>
            <Card>
              <Text style={s.ct}>Últimos 14 días · toca una barra</Text>
              <StackedBars data={last14} selected={selected.day} onSelect={setSel} />
              <Legend />
            </Card>
            <Card style={{ marginTop: 12 }}>
              <Text style={s.ct}>{longDate(selected.day)}</Text>
              <View style={[s.pill, { backgroundColor: ps.soft }]}>
                <Ionicons name={ps.icon as any} size={16} color={ps.color} />
                <Text style={{ color: ps.color, fontWeight: '800', fontSize: 13 }}>{cls.label}</Text>
              </View>
              {cls.reasons.map((r) => <Text key={r} style={s.li}>• {r}</Text>)}
              <View style={s.metrics}>
                {[
                  ['Total', fmt(selected.total)],
                  ['Distractivo', fmt(selected.distractive)],
                  ['Nocturno', fmt(selected.night)],
                  ['Aperturas', String(selected.opens)],
                  ['Sesiones largas', String(selected.longSessions)],
                  ['Metas', `${selected.goalCompliance}%`],
                ].map(([l, v]) => (
                  <View key={l} style={s.m}>
                    <Text style={{ color: C.muted, fontSize: 11 }}>{l}</Text>
                    <Text style={{ color: C.text, fontWeight: '800', fontSize: 15 }}>{v}</Text>
                  </View>
                ))}
              </View>
            </Card>
            <Text style={[s.ct, { marginTop: 16 }]}>Clasificación por día</Text>
            {days.slice(-7).reverse().map((d) => {
              const c = classOf(d);
              const st = patternStyle[c.label];
              return (
                <Card key={d.day} style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ width: 34, fontWeight: '800', color: C.text }}>{dayLabel(d.day)}</Text>
                  <Text style={{ flex: 1, color: C.muted, fontSize: 12 }}>{fmt(d.total)} · {fmt(d.distractive)} distractivo</Text>
                  <View style={[s.pill, { backgroundColor: st.soft, marginTop: 0 }]}>
                    <Text style={{ color: st.color, fontWeight: '700', fontSize: 11 }}>{c.label}</Text>
                  </View>
                </Card>
              );
            })}
          </>
        ) : (
          <>
            <Text style={{ color: C.muted, fontSize: 13, marginBottom: 8 }}>Promedios diarios por semana para ver si tus hábitos mejoran, empeoran o se repiten.</Text>
            {weeks.map((w, i) => {
              const prev = weeks[i - 1];
              const dis = avg(w, (d) => d.distractive);
              const dd = prev ? Math.round(((dis - avg(prev, (d) => d.distractive)) / avg(prev, (d) => d.distractive)) * 100) : null;
              const back = weeks.length - 1 - i;
              const label = back === 0 ? 'Últimos 7 días' : `Hace ${back * 7 + 1}–${back * 7 + 7} días`;
              return (
                <Card key={i} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={s.ct}>{label}</Text>
                    {dd !== null && (
                      <Text style={{ fontWeight: '800', color: dd <= 0 ? C.green : C.red, fontSize: 13 }}>
                        {dd <= 0 ? '↓' : '↑'} {Math.abs(dd)}% distractivo
                      </Text>
                    )}
                  </View>
                  <View style={s.metrics}>
                    {[
                      ['Total/día', fmt(avg(w, (d) => d.total))],
                      ['Distractivo/día', fmt(dis)],
                      ['Nocturno/día', fmt(avg(w, (d) => d.night))],
                      ['Productivo', `${Math.round(avg(w, (d) => d.productiveRatio))}%`],
                      ['Metas', `${Math.round(avg(w, (d) => d.goalCompliance))}%`],
                      ['Índice interr.', String(Math.round(avg(w, (d) => d.interruptionIndex)))],
                    ].map(([l, v]) => (
                      <View key={l} style={s.m}>
                        <Text style={{ color: C.muted, fontSize: 11 }}>{l}</Text>
                        <Text style={{ color: C.text, fontWeight: '800', fontSize: 15 }}>{v}</Text>
                      </View>
                    ))}
                  </View>
                </Card>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 16, paddingBottom: 30, maxWidth: 640, width: '100%', alignSelf: 'center' },
  h: { fontSize: 24, fontWeight: '800', color: C.text },
  ct: { fontWeight: '800', color: C.text, fontSize: 15, marginBottom: 6 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, marginVertical: 6 },
  li: { color: C.text, fontSize: 13, marginTop: 2 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  m: { width: '30%', flexGrow: 1 },
});
