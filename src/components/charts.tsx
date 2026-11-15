import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { DayKpis } from '../lib/analysis';
import { C } from '../lib/theme';

const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const dayLabel = (iso: string) => DOW[new Date(iso + 'T12:00:00').getDay()];

// Barras apiladas: productivo / recreativo / distractivo (minutos por día)
export function StackedBars({ data, selected, onSelect, height = 170 }: { data: DayKpis[]; selected?: string; onSelect?: (d: string) => void; height?: number }) {
  const [w, setW] = useState(300);
  const max = Math.max(60, ...data.map((d) => d.total));
  const top = Math.ceil(max / 60);
  const padL = 26;
  const padB = 22;
  const plotH = height - padB - 6;
  const slot = (w - padL) / data.length;
  const bw = Math.min(26, slot * 0.6);
  const y = (m: number) => (m / (top * 60)) * plotH;
  const grid = Array.from({ length: top + 1 }, (_, i) => i).filter((i) => top <= 8 || i % 2 === 0);
  return (
    <View onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}>
      <Svg width={w} height={height}>
        {grid.map((i) => (
          <G key={i}>
            <Line x1={padL} x2={w} y1={6 + plotH - i * (plotH / top)} y2={6 + plotH - i * (plotH / top)} stroke="#E2E8F0" strokeWidth={1} />
            <SvgText x={0} y={10 + plotH - i * (plotH / top)} fontSize={10} fill={C.muted}>{`${i}h`}</SvgText>
          </G>
        ))}
        {data.map((d, i) => {
          const x = padL + i * slot + (slot - bw) / 2;
          let acc = 0;
          const seg = [
            { v: d.productive, c: C.green },
            { v: d.recreational, c: C.blue },
            { v: d.distractive, c: C.orange },
          ];
          const sel = selected === d.day;
          return (
            <G key={d.day}>
              {sel && <Rect x={x - 4} y={0} width={bw + 8} height={height - padB + 6} rx={8} fill="#F1F5F9" />}
              {seg.map((sg, k) => {
                const h = y(sg.v);
                const yy = 6 + plotH - y(acc) - h;
                acc += sg.v;
                return <Rect key={k} x={x} y={yy} width={bw} height={Math.max(0, h)} fill={sg.c} rx={k === 2 ? 4 : 0} />;
              })}
              <SvgText x={x + bw / 2} y={height - 6} fontSize={10} fill={sel ? C.text : C.muted} fontWeight={sel ? '700' : '400'} textAnchor="middle">
                {dayLabel(d.day)}
              </SvgText>
            </G>
          );
        })}
      </Svg>
      {onSelect && (
        <View style={{ position: 'absolute', left: padL, top: 0, height, width: w - padL, flexDirection: 'row' }}>
          {data.map((d) => (
            <Pressable key={d.day} accessibilityLabel={`Ver ${d.day}`} onPress={() => onSelect(d.day)} style={{ width: slot, height }} />
          ))}
        </View>
      )}
    </View>
  );
}

export function Legend() {
  const it = [
    ['Productivo', C.green],
    ['Recreativo', C.blue],
    ['Distractivo', C.orange],
  ];
  return (
    <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap', marginTop: 6 }}>
      {it.map(([l, c]) => (
        <View key={l} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: c }} />
          <Text style={{ fontSize: 12, color: C.muted }}>{l}</Text>
        </View>
      ))}
    </View>
  );
}

export function Donut({ productive, recreational, distractive, size = 120 }: { productive: number; recreational: number; distractive: number; size?: number }) {
  const total = productive + recreational + distractive || 1;
  const r = size / 2 - 12;
  const circ = 2 * Math.PI * r;
  const parts = [
    { v: productive, c: C.green },
    { v: recreational, c: C.blue },
    { v: distractive, c: C.orange },
  ];
  let off = 0;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <G>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke="#E2E8F0" strokeWidth={14} fill="none" />
          {parts.map((p, i) => {
            const len = (p.v / total) * circ;
            const el = <Circle key={i} cx={size / 2} cy={size / 2} r={r} stroke={p.c} strokeWidth={14} fill="none" strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={circ / 4 - off} />;
            off += len;
            return el;
          })}
        </G>
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: C.text }}>{Math.round((productive / total) * 100)}%</Text>
        <Text style={{ fontSize: 11, color: C.muted }}>productivo</Text>
      </View>
    </View>
  );
}

export const Press = Pressable;
