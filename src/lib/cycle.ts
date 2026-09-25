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

// --- Phases du cycle pour le calendrier (demande d'Anouk, 25/09/2026) ---
// Modèle courant, volontairement simple : l'ovulation a lieu ~14 jours avant
// les règles suivantes (la phase lutéale est la plus stable d'une femme à
// l'autre) ; fenêtre fertile = les 5 jours qui précèdent + le jour
// d'ovulation. Une estimation calendaire, pas une méthode de contraception.
const LUTEAL_LENGTH_DAYS = 14;
const FERTILE_DAYS_BEFORE_OVULATION = 5;

export type CyclePhase = 'regles' | 'folliculaire' | 'fertile' | 'ovulation' | 'luteale';

export const PHASE_LABELS: Record<CyclePhase, string> = {
  regles: 'Règles',
  folliculaire: 'Phase folliculaire',
  fertile: 'Période fertile',
  ovulation: 'Ovulation',
  luteale: 'Phase lutéale',
};

export interface CycleDayInfo {
  phase: CyclePhase;
  /** Jour du cycle (1 = premier jour des règles). */
  cycleDay: number;
  /** true si ce jour dépend d'un cycle estimé (règles pas encore notées). */
  predicted: boolean;
  cycleStart: string;
  nextStart: string;
  ovulation: string;
}

export function cycleDayInfo(
  dateKey: string,
  cycleEntries: CycleEntry[],
  periodLengthDays?: number | null,
): CycleDayInfo | null {
  const starts = [...new Set(cycleEntries.map((e) => e.entry_date))].sort();
  if (starts.length === 0 || dateKey < starts[0]) return null;
  const cycleLength = averageCycleLength(cycleEntries);
  const periodLength = periodLengthDays ?? DEFAULT_PERIOD_LENGTH_DAYS;

  // Dernier début noté au plus tard ce jour-là, et début suivant (noté, ou
  // estimé avec la durée moyenne du cycle).
  let start = starts.filter((s) => s <= dateKey).pop() as string;
  const noted = starts.find((s) => s > start);
  // Un écart noté aberrant (oubli d'une règle) : on retombe sur l'estimation.
  let next = noted && daysBetween(start, noted) <= MAX_PLAUSIBLE_CYCLE_DAYS ? noted : addDays(start, cycleLength);
  let predicted = false;
  while (dateKey >= next) {
    start = next;
    next = addDays(start, cycleLength);
    predicted = true;
  }

  const ovulation = addDays(next, -LUTEAL_LENGTH_DAYS);
  const fertileStart = addDays(ovulation, -FERTILE_DAYS_BEFORE_OVULATION);
  let phase: CyclePhase;
  if (dateKey < addDays(start, periodLength)) phase = 'regles';
  else if (dateKey === ovulation) phase = 'ovulation';
  else if (dateKey >= fertileStart && dateKey < ovulation) phase = 'fertile';
  else if (dateKey > ovulation) phase = 'luteale';
  else phase = 'folliculaire';

  return {
    phase,
    cycleDay: daysBetween(start, dateKey) + 1,
    predicted,
    cycleStart: start,
    nextStart: next,
    ovulation,
  };
}
