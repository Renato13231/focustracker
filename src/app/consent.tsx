import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card } from '../components/ui';
import { C } from '../lib/theme';
import { useStore } from '../lib/store';

export default function Consent() {
  const router = useRouter();
  const { update } = useStore();
  const [ok, setOk] = useState(false);
  const yes = ['Duración de sesiones de aplicaciones', 'Frecuencia de apertura de aplicaciones', 'Categorías de uso (ej. redes sociales, productividad)', 'Horarios de actividad', 'Uso nocturno del dispositivo'];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={s.wrap}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: 8 }}>
          <Ionicons name="chevron-back" size={26} color={C.text} />
        </Pressable>
        <Text style={s.h}>Consentimiento informado</Text>
        <Text style={s.p}>Para usar FocusTracker necesitamos tu autorización para recolectar y analizar datos sobre tu comportamiento digital, con el fin de mejorar tu gestión del tiempo. Tus datos serán tratados con confidencialidad y privacidad.</Text>
        <Card style={{ marginTop: 14 }}>
          <Text style={s.t}>Datos que se utilizan</Text>
          {yes.map((y) => (
            <View key={y} style={s.row}>
              <Ionicons name="checkmark-circle" size={18} color={C.green} />
              <Text style={s.li}>{y}</Text>
            </View>
          ))}
        </Card>
        <Card style={{ marginTop: 12, backgroundColor: C.redSoft, borderColor: '#FECACA' }}>
          <View style={s.row}>
            <Ionicons name="shield-checkmark" size={20} color={C.red} />
            <Text style={[s.li, { fontWeight: '700' }]}>FocusTracker NO accede a contenido privado</Text>
          </View>
          <Text style={[s.li, { marginTop: 4 }]}>Mensajes, imágenes, contraseñas ni conversaciones. No realiza diagnósticos clínicos ni bloquea tus aplicaciones.</Text>
        </Card>
        <Pressable onPress={() => setOk(!ok)} style={[s.row, { marginVertical: 18, alignItems: 'flex-start' }]} accessibilityRole="checkbox" accessibilityState={{ checked: ok }}>
          <View style={[s.box, ok && { backgroundColor: C.primary, borderColor: C.primary }]}>{ok && <Ionicons name="checkmark" size={16} color="#fff" />}</View>
          <Text style={[s.li, { flex: 1 }]}>He leído y acepto el uso de mis datos de comportamiento digital para el análisis dentro de la aplicación.</Text>
        </Pressable>
        <Button label="Continuar" icon="arrow-forward" disabled={!ok} onPress={() => { update({ consent: true }); router.push('/setup'); }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 20, maxWidth: 560, width: '100%', alignSelf: 'center' },
  h: { fontSize: 26, fontWeight: '800', color: C.text },
  p: { color: C.muted, lineHeight: 22, marginTop: 8, fontSize: 14 },
  t: { fontWeight: '700', color: C.text, marginBottom: 8, fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 3 },
  li: { color: C.text, fontSize: 14, lineHeight: 20 },
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: C.muted, alignItems: 'center', justifyContent: 'center' },
});
