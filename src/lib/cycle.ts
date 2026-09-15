import { addDays } from './date';
import type { CycleEntry } from '../types';

// Durée moyenne des règles — approximation volontairement large (la vraie
// durée varie), juste pour fenêtrer le rappel fer, pas pour prédire un cycle.
const PERIOD_LENGTH_DAYS = 5;

export function isIronReminderDay(dateKey: string, cycleEntries: CycleEntry[]): boolean {
  return cycleEntries.some((entry) => {
    const end = addDays(entry.entry_date, PERIOD_LENGTH_DAYS);
    return dateKey >= entry.entry_date && dateKey <= end;
  });
}
