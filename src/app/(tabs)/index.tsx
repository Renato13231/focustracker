import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Donut, Legend, StackedBars } from '../../components/charts';
import { Card, IconBadge, Progress } from '../../components/ui';
import { patternStyle } from '../../lib/analysis';
import { C, fmt } from '../../lib/theme';
import { useStore } from '../../lib/store';

const delta = (a: number, b: number) => a - b; // diferencia absoluta vs. ayer

export default function Home() {
  const router = useRouter();
  const { state, today, days, last7, classification, tips, alertList } = useStore();
  if (!today || !classification) return null;
  const yest = days[days.length - 2];
  const ps = patternStyle[classification.label];
  const Kpi = ({ icon, color, soft, label, value, d, good, n }: { icon: string; color: string; soft: string; label: string; value: string; d?: number; good?: 'down' | 'up'; n?: boolean }) => {
    const isGood = d === undefined || d === 0 ? undefined : good === 'down' ? d < 0 : d > 0;
    return (
      <Card style={{ flex: 1, minWidth: 140 }}>
        <IconBadge name={icon} color={color} soft={soft} size={32} />
        <Text style={s.kl}>{label}</Text>
        <Text style={s.kv}>{value}</Text>
        {d !== undefined && (
          <Text style={{ fontSize: 11, color: isGood === undefined ? C.muted : isGood ? C.green : C.red }}>
            {d > 0 ? '↑' : d < 0 ? '↓' : '•'} {n ? Math.abs(d) : fmt(Math.abs(d))} vs. ayer
          </Text>
        )}
      </Card>
    );
  };
  const ic = today.interruptionIndex;
  const icLabel = ic < 40 ? 'Bajo' : ic < 70 ? 'Moderado' : 'Alto';
  const icColor = ic < 40 ? C.green : ic < 70 ? C.amber : C.red;
  const top = tips[0];
  const gc = today.goalCompliance;
  const gcColor = gc >= 75 ? C.green : gc >= 50 ? C.amber : C.red;
  const gcText = gc >= 75 ? '¡Buen trabajo!' : gc >= 50 ? 'Vas a medias' : 'Hay que mejorar';
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={s.wrap}>
        <View style={s.head}>
          <View style={{ flex: 1 }}>
            <Text style={s.brand}>Focus<Text style={{ color: C.primary }}>Tracker</Text></Text>
            <Text style={s.hi}>¡Hola, {state.name || 'bienvenido'}! 👋</Text>
            <Text style={{ color: C.muted, fontSize: 13 }}>Aquí tienes tu resumen digital de hoy.</Text>
          </View>
          <Pressable onPress={() => router.push('/alerts')} accessibilityLabel="Alertas" style={s.bell}>
            <Ionicons name="notifications-outline" size={22} color={C.text} />
            {alertList.length > 0 && <View style={s.dot}><Text style={s.dotT}>{alertList.length}</Text></View>}
          </Pressable>
        </View>

        <View style={s.grid}>
          <Kpi icon="time-outline" color={C.blue} soft={C.blueSoft} label="Tiempo digital total" value={fmt(today.total)} d={delta(today.total, yest?.total ?? 0)} good="down" />
          <Kpi icon="phone-portrait-outline" color={C.orange} soft={C.orangeSoft} label="Tiempo distractivo" value={fmt(today.distractive)} d={delta(today.distractive, yest?.distractive ?? 0)} good="down" />
          <Kpi icon="moon-outline" color={C.purple} soft={C.purpleSoft} label="Uso nocturno" value={fmt(today.night)} d={delta(today.night, yest?.night ?? 0)} good="down" />
          <Kpi icon="hourglass-outline" color={C.amber} soft={C.amberSoft} label="Sesiones prolongadas" value={`${today.longSessions}`} d={delta(today.longSessions, yest?.longSessions ?? 0)} good="down" n />
        </View>

        <View style={s.grid}>
          <Card style={{ flex: 1, minWidth: 150 }}>
            <Text style={s.kl}>Índice de interrupción</Text>
            <Text style={s.kv}>{ic}<Text style={{ fontSize: 13, color: C.muted }}> /100</Text></Text>
            <Text style={{ color: icColor, fontWeight: '700', fontSize: 12, marginBottom: 6 }}>{icLabel} · {today.opens} aperturas</Text>
            <Progress pct={ic} color={icColor} />
          </Card>
          <Card style={{ flex: 1, minWidth: 150 }}>
            <Text style={s.kl}>Cumplimiento de metas</Text>
            <Text style={s.kv}>{today.goalCompliance}%</Text>
            <Text style={{ color: gcColor, fontWeight: '700', fontSize: 12, marginBottom: 6 }}>{today.goals.filter((g) => g.ok).length} de {today.goals.length} metas · {gcText}</Text>
            <Progress pct={today.goalCompliance} color={gcColor} />
          </Card>
        </View>

        <Card style={{ marginTop: 12, backgroundColor: ps.soft, borderColor: ps.color + '55' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name={ps.icon as any} size={28} color={ps.color} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: C.muted }}>Patrón detectado hoy</Text>
              <Text style={{ fontSize: 18, fontWeight: '800', color: ps.color }}>{classification.label}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>Clasificado con: {classification.method === 'random_forest' ? 'modelo Random Forest' : 'reglas por umbrales'}</Text>
          {classification.reasons.map((r) => (
            <Text key={r} style={{ color: C.text, fontSize: 13, marginTop: 4 }}>• {r}</Text>
          ))}
        </Card>

        <Card style={{ marginTop: 12 }}>
          <Text style={s.ct}>Uso de los últimos 7 días</Text>
          <StackedBars data={last7} />
          <Legend />
          <Text style={{ color: C.muted, fontSize: 12, marginTop: 8 }}>Promedio diario: {fmt(last7.reduce((a, d) => a + d.total, 0) / last7.length)}</Text>
        </Card>

        <Card style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Donut productive={today.productive} recreational={today.recreational} distractive={today.distractive} />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={s.ct}>Hoy por tipo de uso</Text>
            {[['Productivo', today.productive, C.green], ['Recreativo', today.recreational, C.blue], ['Distractivo', today.distractive, C.orange]].map(([l, v, c]) => (
              <View key={l as string} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: c as string }} />
                <Text style={{ flex: 1, fontSize: 12, color: C.muted }}>{l as string}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: C.text }}>{fmt(v as number)}</Text>
              </View>
            ))}
          </View>
        </Card>

        {top && (
          <Pressable onPress={() => router.push('/(tabs)/tips')}>
            <Card style={{ marginTop: 12, backgroundColor: C.blueSoft, borderColor: '#BFDBFE', flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Ionicons name={top.icon as any} size={26} color={C.blue} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: C.blue, fontWeight: '700' }}>RECOMENDACIÓN PERSONALIZADA</Text>
                <Text style={{ fontWeight: '800', color: C.text, fontSize: 15 }}>{top.title}</Text>
                <Text style={{ color: C.muted, fontSize: 12 }} numberOfLines={2}>{top.text}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={C.blue} />
            </Card>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 16, paddingBottom: 30, maxWidth: 640, width: '100%', alignSelf: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  brand: { fontSize: 14, fontWeight: '800', color: C.text, marginBottom: 6 },
  hi: { fontSize: 22, fontWeight: '800', color: C.text },
  bell: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  dotT: { color: '#fff', fontSize: 10, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  kl: { color: C.muted, fontSize: 12, marginTop: 8 },
  kv: { color: C.text, fontSize: 22, fontWeight: '800', marginVertical: 2 },
  ct: { fontWeight: '800', color: C.text, fontSize: 15, marginBottom: 6 },
});
