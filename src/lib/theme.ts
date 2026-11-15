export const C = {
  bg: '#F4F8FB',
  card: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  primary: '#0F766E',
  blue: '#2563EB',
  blueSoft: '#DBEAFE',
  green: '#16A34A',
  greenSoft: '#DCFCE7',
  orange: '#F97316',
  orangeSoft: '#FFEDD5',
  red: '#DC2626',
  redSoft: '#FEE2E2',
  purple: '#7C3AED',
  purpleSoft: '#EDE9FE',
  amber: '#D97706',
  amberSoft: '#FEF3C7',
};

export const fmt = (min: number) => {
  const m = Math.round(min);
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r} min`;
  return r === 0 ? `${h} h` : `${h} h ${r} min`;
};
