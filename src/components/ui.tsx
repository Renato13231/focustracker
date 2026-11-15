import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { C } from '../lib/theme';

export const Card = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => (
  <View style={[s.card, style]}>{children}</View>
);

export const IconBadge = ({ name, color, soft, size = 36 }: { name: string; color: string; soft: string; size?: number }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2.4, backgroundColor: soft, alignItems: 'center', justifyContent: 'center' }}>
    <Ionicons name={name as any} size={size * 0.55} color={color} />
  </View>
);

export const Button = ({ label, onPress, disabled, variant = 'primary', icon }: { label: string; onPress: () => void; disabled?: boolean; variant?: 'primary' | 'ghost' | 'danger'; icon?: string }) => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      s.btn,
      variant === 'primary' && { backgroundColor: disabled ? '#CBD5E1' : C.primary },
      variant === 'ghost' && { backgroundColor: 'transparent', borderWidth: 1, borderColor: C.border },
      variant === 'danger' && { backgroundColor: C.redSoft },
      pressed && { opacity: 0.8 },
    ]}
  >
    <Text style={[s.btnText, variant === 'ghost' && { color: C.text }, variant === 'danger' && { color: C.red }]}>{label}</Text>
    {icon ? <Ionicons name={icon as any} size={18} color={variant === 'primary' ? '#fff' : C.text} /> : null}
  </Pressable>
);

export const Chip = ({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) => (
  <Pressable onPress={onPress} style={[s.chip, active && { backgroundColor: C.primary, borderColor: C.primary }]}>
    <Text style={[s.chipText, active && { color: '#fff' }]}>{label}</Text>
  </Pressable>
);

export const Stepper = ({ value, onChange, step = 1, min, max, format }: { value: number; onChange: (v: number) => void; step?: number; min: number; max: number; format?: (v: number) => string }) => (
  <View style={s.stepper}>
    <Pressable accessibilityLabel="Disminuir" onPress={() => onChange(Math.max(min, value - step))} style={s.stepBtn}>
      <Ionicons name="remove" size={18} color={C.text} />
    </Pressable>
    <Text style={s.stepVal}>{format ? format(value) : value}</Text>
    <Pressable accessibilityLabel="Aumentar" onPress={() => onChange(Math.min(max, value + step))} style={s.stepBtn}>
      <Ionicons name="add" size={18} color={C.text} />
    </Pressable>
  </View>
);

export const Progress = ({ pct, color }: { pct: number; color: string }) => (
  <View style={s.track}>
    <View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', backgroundColor: color, borderRadius: 4 }} />
  </View>
);

export const H = ({ children }: { children: React.ReactNode }) => <Text style={s.h}>{children}</Text>;

const s = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.border },
  btn: { height: 50, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: '#fff' },
  chipText: { color: C.text, fontWeight: '600', fontSize: 13 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  stepVal: { minWidth: 64, textAlign: 'center', fontWeight: '700', color: C.text, fontSize: 15 },
  track: { height: 8, borderRadius: 4, backgroundColor: '#E2E8F0', overflow: 'hidden' },
  h: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 8 },
});
