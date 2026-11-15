import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Chip, Stepper } from '../../components/ui';
import { hasPermission, openSettings, realDataSupported } from '../../lib/realdata';
import { APPS, Category, GROUPS, Group } from '../../lib/data';
import { C } from '../../lib/theme';
import { useStore } from '../../lib/store';

const confirmDo = (msg: string, fn: () => void) => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(msg)) fn();
    return;
  }
  Alert.alert('Confirmar', msg, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Borrar todo', style: 'destructive', onPress: fn },
  ]);
};

const CATS: Category[] = ['productiva', 'recreativa', 'distractiva'];

export default function Profile() {
  const router = useRouter();
  const { state, update, resetAll, regenerate, syncStatus, refreshReal, realStatus } = useStore();
  const [url, setUrl] = useState(state.apiUrl);
  const toggle = (g: Group) => update({ monitored: state.monitored.includes(g) ? state.monitored.filter((x) => x !== g) : [...state.monitored, g] });
  const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={s.wrap}>
        <Text style={s.h}>Perfil y privacidad</Text>
        <Card style={{ marginTop: 12 }}>
          <Text style={s.t}>{state.name}</Text>
          <Text style={{ color: C.muted }}>{state.email || 'Sin correo registrado'}</Text>
          <Text style={{ color: C.green, fontWeight: '700', fontSize: 12, marginTop: 6 }}>✓ Consentimiento informado aceptado</Text>
        </Card>

        <Card style={{ marginTop: 12 }}>
          <Text style={s.t}>Horario de descanso digital</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
            <View><Text style={s.sm}>Desde</Text><Stepper value={state.nightStart} min={18} max={23} onChange={(v) => update({ nightStart: v })} format={hh} /></View>
            <View><Text style={s.sm}>Hasta</Text><Stepper value={state.nightEnd} min={4} max={10} onChange={(v) => update({ nightEnd: v })} format={hh} /></View>
          </View>
        </Card>

        <Card style={{ marginTop: 12 }}>
          <Text style={s.t}>Categorías monitoreadas</Text>
          <View style={s.wr}>{GROUPS.map((g) => <Chip key={g} label={g} active={state.monitored.includes(g)} onPress={() => toggle(g)} />)}</View>
        </Card>

        <Card style={{ marginTop: 12 }}>
          <Text style={s.t}>Clasificación de aplicaciones</Text>
          <Text style={{ color: C.muted, fontSize: 12, marginBottom: 6 }}>El sistema propone una categoría; puedes ajustarla según tu contexto.</Text>
          {APPS.map((a) => {
            const cur = state.overrides[a.name] ?? a.category;
            return (
              <View key={a.name} style={{ marginTop: 8 }}>
                <Text style={{ fontWeight: '700', color: C.text, fontSize: 13 }}>{a.name} <Text style={{ color: C.muted, fontWeight: '400' }}>· {a.group}</Text></Text>
                <View style={[s.wr, { marginTop: 4 }]}>
                  {CATS.map((c) => (
                    <Chip key={c} label={c} active={cur === c} onPress={() => {
                      const o = { ...state.overrides };
                      if (c === a.category) delete o[a.name]; else o[a.name] = c;
                      update({ overrides: o });
                    }} />
                  ))}
                </View>
              </View>
            );
          })}
        </Card>

        <Card style={{ marginTop: 12, gap: 8 }}>
          <Text style={s.t}>Servidor de análisis (opcional)</Text>
          <Text style={{ color: C.muted, fontSize: 12 }}>Con un servidor FocusTracker, tus registros se guardan allí y el patrón se clasifica con el modelo Random Forest. Sin servidor, todo se calcula en el teléfono con reglas.</Text>
          <TextInput value={url} onChangeText={setUrl} onBlur={() => update({ apiUrl: url.trim() })} autoCapitalize="none" autoCorrect={false} placeholder="https://mi-servidor.com" placeholderTextColor="#94A3B8" style={s.input} />
          <Text style={{ fontSize: 12, fontWeight: '700', color: syncStatus === 'ok' ? C.green : syncStatus === 'error' ? C.red : C.muted }}>
            {syncStatus === 'ok' ? '● Conectado' : syncStatus === 'error' ? '● No se pudo conectar (usando reglas locales)' : syncStatus === 'syncing' ? '● Sincronizando…' : '● Sin servidor'}
          </Text>
        </Card>

        <Card style={{ marginTop: 12, gap: 10 }}>
          <Text style={s.t}>Datos</Text>
          <Text style={{ color: C.muted, fontSize: 12 }}>Esta versión usa datos de uso simulados y los guarda solo en tu dispositivo. En la arquitectura completa, el backend FastAPI + MongoDB Atlas los almacena.</Text>
          {realDataSupported() ? (
            <View style={{ gap: 8 }}>
              <Text style={{ fontWeight: '700', color: C.text, fontSize: 13 }}>Fuente de datos: {state.useRealData ? 'uso real del teléfono' : 'datos simulados'}</Text>
              <Button
                variant="ghost"
                label={state.useRealData ? 'Volver a datos simulados' : 'Usar mi uso real (Android)'}
                icon="phone-portrait-outline"
                onPress={() => {
                  if (!state.useRealData && !hasPermission()) { openSettings(); return; }
                  update({ useRealData: !state.useRealData });
                }}
              />
              {state.useRealData && <Button variant="ghost" label="Actualizar desde el teléfono" icon="refresh" onPress={refreshReal} />}
              <Text style={{ fontSize: 12, color: realStatus === 'ok' ? C.green : realStatus === 'error' ? C.red : C.muted }}>
                {realStatus === 'ok' ? '● Leyendo uso real' : realStatus === 'empty' ? '● Sin registros aún (¿concediste el permiso de acceso a datos de uso?)' : realStatus === 'error' ? '● No se pudo leer el uso' : realStatus === 'loading' ? '● Cargando…' : !hasPermission() ? '● Falta el permiso «Acceso a datos de uso». Se abrirá Ajustes; actívalo para FocusTracker y vuelve a pulsar el botón.' : ''}
              </Text>
            </View>
          ) : (
            <Text style={{ color: C.muted, fontSize: 12 }}>El uso real solo está disponible en Android con la app instalada (no en Expo Go ni en la web).</Text>
          )}
          <Button variant="ghost" label="Generar nuevos datos simulados" icon="refresh" onPress={regenerate} />
          <Button variant="danger" label="Revocar consentimiento y borrar datos" icon="trash-outline" onPress={() => confirmDo('Se revocará tu consentimiento y se borrarán tus datos y tu configuración. ¿Seguro?', () => { resetAll(); router.replace('/'); })} />
        </Card>

        <Card style={{ marginTop: 12 }}>
          <Text style={s.t}>Acerca del proyecto</Text>
          <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 4 }}>
            Sistema inteligente de análisis de comportamiento digital y gestión del tiempo mediante clasificación con inteligencia artificial.{'\n'}
            Autor: Renato Vicente Gana Fuentes · Profesor guía: Miguel Ángel Cochea Tomala{'\n'}
            Universidad Andrés Bello · Ingeniería en Computación e Informática · 2026
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 16, paddingBottom: 30, maxWidth: 640, width: '100%', alignSelf: 'center' },
  h: { fontSize: 24, fontWeight: '800', color: C.text },
  t: { fontWeight: '800', color: C.text, fontSize: 15 },
  sm: { color: C.muted, fontSize: 12, marginBottom: 4 },
  input: { height: 44, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 12, backgroundColor: '#fff', color: C.text, fontSize: 14 },
  wr: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
});
