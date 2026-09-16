import { useEffect, useState } from 'react';
import { addDays, toDateKey } from './date';
import { listActivityEntriesInRange } from '../api/activities';

const WINDOW_DAYS = 14;
// En dessous de ce nombre de jours logués sur la fenêtre, une moyenne serait
// trop bruitée (une seule grosse séance fausserait tout le calcul) — on
// retombe alors sur le multiplicateur générique du niveau d'activité déclaré.
const MIN_DAYS_WITH_ACTIVITY = 3;

export interface MeasuredActivity {
  /** Moyenne quotidienne de calories d'activité sur les derniers jours (jours
   * sans séance comptés comme 0) — null si pas assez de séances loguées. */
  avgDailyActivityKcal: number | null;
  daysWithActivity: number;
  loading: boolean;
}

/** Regarde le carnet d'activité des ~2 dernières semaines pour estimer une
 * dépense réellement mesurée, plutôt que le multiplicateur générique du
 * niveau d'activité déclaré dans le profil. */
export function useMeasuredActivity(): MeasuredActivity {
  const [result, setResult] = useState<MeasuredActivity>({
    avgDailyActivityKcal: null,
    daysWithActivity: 0,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    const today = toDateKey(new Date());
    const startDate = addDays(today, -WINDOW_DAYS + 1);

    listActivityEntriesInRange(startDate, today)
      .then((entries) => {
        if (cancelled) return;
        const totalKcal = entries.reduce((sum, e) => sum + e.calories_kcal, 0);
        const daysWithActivity = new Set(entries.map((e) => e.entry_date)).size;
        setResult({
          avgDailyActivityKcal:
            daysWithActivity >= MIN_DAYS_WITH_ACTIVITY ? totalKcal / WINDOW_DAYS : null,
          daysWithActivity,
          loading: false,
        });
      })
      .catch(() => {
        if (!cancelled) setResult({ avgDailyActivityKcal: null, daysWithActivity: 0, loading: false });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return result;
}
