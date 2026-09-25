// Saisie et affichage d'un exercice de séance : soit des répétitions, soit une
// durée (en secondes, minutes ou heures) — jamais les deux — et une charge
// optionnelle quand on est lesté. La durée est stockée en minutes
// (duration_minutes, utilisée pour les calories) ; l'unité choisie sert à la
// saisie et à l'affichage.
export type DurationUnit = 's' | 'min' | 'h';

export const DURATION_UNITS: { value: DurationUnit; label: string }[] = [
  { value: 's', label: 'sec' },
  { value: 'min', label: 'min' },
  { value: 'h', label: 'h' },
];

const MINUTES_PER_UNIT: Record<DurationUnit, number> = { s: 1 / 60, min: 1, h: 60 };

export function toMinutes(value: number, unit: DurationUnit): number {
  return value * MINUTES_PER_UNIT[unit];
}

export function fromMinutes(minutes: number, unit: DurationUnit): number {
  return Math.round((minutes / MINUTES_PER_UNIT[unit]) * 100) / 100;
}

function formatNumber(n: number): string {
  return n.toLocaleString('fr-CH', { maximumFractionDigits: 2 });
}

export interface ExercisePrescription {
  sets: number | null;
  reps: number | null;
  duration_minutes: number | null;
  duration_unit?: DurationUnit | null;
  load_kg?: number | null;
  rest_seconds: number | null;
}

/** « 3 × 12 · 10 kg · repos 60 s » ou « 3 × 45 s » ou « 20 min ». */
export function describePrescription(p: ExercisePrescription): string {
  const parts: string[] = [];
  const unit = p.duration_unit ?? 'min';
  const amount =
    p.reps != null
      ? formatNumber(p.reps)
      : p.duration_minutes != null
        ? `${formatNumber(fromMinutes(p.duration_minutes, unit))} ${DURATION_UNITS.find((u) => u.value === unit)?.label}`
        : null;
  if (p.sets != null && amount) parts.push(`${formatNumber(p.sets)} × ${amount}`);
  else if (amount) parts.push(amount);
  else if (p.sets != null) parts.push(`${formatNumber(p.sets)} série${p.sets > 1 ? 's' : ''}`);
  if (p.load_kg != null) parts.push(`${formatNumber(p.load_kg)} kg`);
  if (p.rest_seconds != null) parts.push(`repos ${formatNumber(p.rest_seconds)} s`);
  return parts.join(' · ');
}

/** Durée totale d'effort en minutes, pour estimer les calories : séries ×
 * durée quand elle est donnée par série. */
export function effortMinutes(p: ExercisePrescription): number | null {
  if (p.duration_minutes == null) return null;
  return p.duration_minutes * (p.sets ?? 1);
}
