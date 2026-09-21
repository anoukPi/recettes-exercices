import { addDays, daysBetween } from './date';
import type { CycleEntry } from '../types';

// Durées par défaut — repères larges couramment cités (règles : 3-7 jours,
// cycle : 21-35 jours), utilisées seulement quand on n'a pas encore assez
// d'historique ou de réglage personnel pour faire mieux.
const DEFAULT_PERIOD_LENGTH_DAYS = 5;
const DEFAULT_CYCLE_LENGTH_DAYS = 28;
// Au-delà, un écart entre deux dates notées est traité comme une anomalie
// (oubli, double saisie) plutôt qu'un vrai cycle très long, pour ne pas
// fausser la moyenne.
const MAX_PLAUSIBLE_CYCLE_DAYS = 60;

export function isIronReminderDay(
  dateKey: string,
  cycleEntries: CycleEntry[],
  periodLengthDays?: number | null,
): boolean {
  const length = periodLengthDays ?? DEFAULT_PERIOD_LENGTH_DAYS;
  return cycleEntries.some((entry) => {
    const end = addDays(entry.entry_date, length);
    return dateKey >= entry.entry_date && dateKey <= end;
  });
}

/** true si la date donnée tombe dans une fenêtre de règles notée — même
 * fenêtre que le rappel fer, nommée plus explicitement pour un affichage
 * "règles en cours" plutôt qu'un rappel nutritionnel précis. */
export const isOnPeriod = isIronReminderDay;

/** Durée moyenne du cycle (du début d'une règle au début de la suivante),
 * calculée depuis l'historique noté. Repli sur 28 jours (moyenne courante)
 * si moins de deux dates notées pour calculer un vrai écart. */
export function averageCycleLength(cycleEntries: CycleEntry[]): number {
  if (cycleEntries.length < 2) return DEFAULT_CYCLE_LENGTH_DAYS;
  const sorted = [...cycleEntries].sort((a, b) => a.entry_date.localeCompare(b.entry_date));
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const gap = daysBetween(sorted[i - 1].entry_date, sorted[i].entry_date);
    if (gap > 0 && gap <= MAX_PLAUSIBLE_CYCLE_DAYS) gaps.push(gap);
  }
  if (gaps.length === 0) return DEFAULT_CYCLE_LENGTH_DAYS;
  return Math.round(gaps.reduce((sum, g) => sum + g, 0) / gaps.length);
}

export interface PredictedPeriod {
  start: string;
  end: string;
}

/** Prochaine règle estimée (début + fin), depuis la dernière date notée, la
 * durée moyenne du cycle (calculée) et la durée des règles (réglage ou
 * repère par défaut). null si aucune date n'a encore été notée. */
export function predictNextPeriod(
  cycleEntries: CycleEntry[],
  periodLengthDays?: number | null,
): PredictedPeriod | null {
  if (cycleEntries.length === 0) return null;
  const lastStart = cycleEntries.reduce((latest, e) => (e.entry_date > latest ? e.entry_date : latest), cycleEntries[0].entry_date);
  const cycleLength = averageCycleLength(cycleEntries);
  const start = addDays(lastStart, cycleLength);
  const end = addDays(start, periodLengthDays ?? DEFAULT_PERIOD_LENGTH_DAYS);
  return { start, end };
}

/** true durant la semaine précédant la prochaine règle estimée (phase
 * lutéale tardive) — fenêtre où le besoin énergétique et certains besoins
 * nutritionnels (magnésium, oméga-3) sont couramment cités comme plus élevés,
 * plutôt que pendant les règles elles-mêmes. */
export function isLutealPhase(
  dateKey: string,
  cycleEntries: CycleEntry[],
  periodLengthDays?: number | null,
): boolean {
  const predicted = predictNextPeriod(cycleEntries, periodLengthDays);
  if (!predicted) return false;
  if (isOnPeriod(dateKey, cycleEntries, periodLengthDays)) return false;
  const lutealStart = addDays(predicted.start, -7);
  return dateKey >= lutealStart && dateKey < predicted.start;
}
