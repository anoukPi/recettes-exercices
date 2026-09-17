import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  addDays,
  endOfMonth,
  formatDateKeyFr,
  formatDateRangeFr,
  startOfMonth,
  startOfWeek,
  toDateKey,
} from '../lib/date';
import { usePeriodSummary, type DaySummary } from '../lib/usePeriodSummary';
import { useSession } from '../lib/auth';
import { GapEvolutionChart, type GapPoint } from '../components/GapEvolutionChart';
import { INTENSITIES, TRAINING_TYPES } from '../types';
import type { DailyTargets } from '../lib/dailyNeeds';

type PeriodType = 'semaine' | 'mois';

function computeRange(periodType: PeriodType, anchor: string): { start: string; end: string } {
  if (periodType === 'semaine') {
    const start = startOfWeek(anchor);
    return { start, end: addDays(start, 6) };
  }
  return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
}

function shiftAnchor(periodType: PeriodType, anchor: string, direction: 1 | -1): string {
  if (periodType === 'semaine') return addDays(anchor, 7 * direction);
  const [year, month] = anchor.split('-').map(Number);
  const date = new Date(year, month - 1 + direction, 1);
  return toDateKey(date);
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function formatGap(gap: number | null, unit: string): string {
  if (gap === null) return '—';
  return `${gap >= 0 ? '+' : ''}${Math.round(gap)} ${unit}`;
}

export function BilanPage() {
  const { session, loading: authLoading } = useSession();
  const [periodType, setPeriodType] = useState<PeriodType>('semaine');
  const [anchor, setAnchor] = useState(toDateKey(new Date()));

  const { start, end } = computeRange(periodType, anchor);
  const { days, dailyTargets, loading } = usePeriodSummary(start, end);

  const stats = useMemo(() => {
    const daysWithData = days.filter((d) => d.hasData);
    const caloriesGaps = dailyTargets
      ? daysWithData.map((d) => {
          const expenses = d.activities.length > 0 ? dailyTargets.bmr_kcal + d.activityCalories : dailyTargets.tdee_kcal;
          return d.calories - expenses;
        })
      : [];
    const proteinGaps = dailyTargets ? daysWithData.map((d) => d.protein_g - dailyTargets.protein_g) : [];
    const carbsGaps = dailyTargets ? daysWithData.map((d) => d.carbs_g - dailyTargets.carbs_g) : [];
    const fatGaps = dailyTargets ? daysWithData.map((d) => d.fat_g - dailyTargets.fat_g) : [];

    const daysWithActivity = days.filter((d) => d.activities.length > 0).length;
    const activityRate = days.length > 0 ? (daysWithActivity / days.length) * 100 : 0;

    const periodDates = days.filter((d) => d.hasPeriod).map((d) => d.date);

    return {
      avgCaloriesGap: average(caloriesGaps),
      avgProteinGap: average(proteinGaps),
      avgCarbsGap: average(carbsGaps),
      avgFatGap: average(fatGaps),
      activityRate,
      daysWithActivity,
      periodDates,
    };
  }, [days, dailyTargets]);

  const chartSeries = useMemo(() => {
    if (!dailyTargets) return null;
    const toPoints = (fn: (d: DaySummary, targets: DailyTargets) => number): GapPoint[] =>
      days.map((d) => ({ date: d.date, value: d.hasData ? fn(d, dailyTargets) : null }));

    return {
      calories: toPoints((d, t) => {
        const expenses = d.activities.length > 0 ? t.bmr_kcal + d.activityCalories : t.tdee_kcal;
        return d.calories - expenses;
      }),
      protein: toPoints((d, t) => d.protein_g - t.protein_g),
      carbs: toPoints((d, t) => d.carbs_g - t.carbs_g),
      fat: toPoints((d, t) => d.fat_g - t.fat_g),
    };
  }, [days, dailyTargets]);

  if (authLoading) return null;

  if (!session) {
    return (
      <section className="journal">
        <p className="hint">
          Connecte-toi dans <Link to="/settings">Paramètres</Link> pour voir ton bilan.
        </p>
      </section>
    );
  }

  return (
    <section className="journal">
      <h2>Bilan</h2>

      <div className="journal-meal-picker">
        <label htmlFor="period-type">Vue :</label>
        <select id="period-type" value={periodType} onChange={(e) => setPeriodType(e.target.value as PeriodType)}>
          <option value="semaine">Semaine</option>
          <option value="mois">Mois</option>
        </select>
      </div>

      <div className="journal-date-nav">
        <button type="button" onClick={() => setAnchor(shiftAnchor(periodType, anchor, -1))}>
          ← Précédent
        </button>
        <strong>{formatDateRangeFr(start, end)}</strong>
        <button type="button" onClick={() => setAnchor(shiftAnchor(periodType, anchor, 1))}>
          Suivant →
        </button>
      </div>

      {loading && <p>Chargement…</p>}
      {!dailyTargets && !loading && (
        <p className="hint">
          Renseigne ton <Link to="/settings">profil dans les Paramètres</Link> pour voir les écarts
          par rapport à tes objectifs.
        </p>
      )}

      <div className="bilan-stat-grid">
        <div className="bilan-stat-card">
          <span className="bilan-stat-label">Écart calories (moyenne/jour)</span>
          <span className="bilan-stat-value">{formatGap(stats.avgCaloriesGap, 'kcal')}</span>
        </div>
        <div className="bilan-stat-card">
          <span className="bilan-stat-label">Écart protéines (moyenne/jour)</span>
          <span className="bilan-stat-value">{formatGap(stats.avgProteinGap, 'g')}</span>
        </div>
        <div className="bilan-stat-card">
          <span className="bilan-stat-label">Écart glucides (moyenne/jour)</span>
          <span className="bilan-stat-value">{formatGap(stats.avgCarbsGap, 'g')}</span>
        </div>
        <div className="bilan-stat-card">
          <span className="bilan-stat-label">Écart lipides (moyenne/jour)</span>
          <span className="bilan-stat-value">{formatGap(stats.avgFatGap, 'g')}</span>
        </div>
        <div className="bilan-stat-card">
          <span className="bilan-stat-label">Taux d'activité physique</span>
          <span className="bilan-stat-value">
            {Math.round(stats.activityRate)}%{' '}
            <span className="hint">({stats.daysWithActivity}/{days.length} jours)</span>
          </span>
        </div>
        <div className="bilan-stat-card">
          <span className="bilan-stat-label">Règles</span>
          <span className="bilan-stat-value">
            {stats.periodDates.length > 0 ? (
              stats.periodDates.map((d) => formatDateKeyFr(d)).join(', ')
            ) : (
              <span className="hint">Aucune notée cette période</span>
            )}
          </span>
        </div>
      </div>

      <p className="hint">
        Les écarts "Écart X (g)" comparent ton apport à ton objectif de profil ; l'écart calories
        compare ton apport à tes dépenses réelles (métabolisme de base + activité, comme dans le
        Carnet).
      </p>

      {chartSeries && (
        <div className="gap-chart-grid">
          <GapEvolutionChart title="Écart calories" unit="kcal" data={chartSeries.calories} />
          <GapEvolutionChart title="Écart protéines" unit="g" data={chartSeries.protein} />
          <GapEvolutionChart title="Écart glucides" unit="g" data={chartSeries.carbs} />
          <GapEvolutionChart title="Écart lipides" unit="g" data={chartSeries.fat} />
        </div>
      )}

      <h3>Détail par jour</h3>
      <ul className="journal-entry-list">
        {days.map((day) => (
          <li key={day.date} className="journal-entry activity-entry">
            <div className="journal-entry-row">
              <div className="journal-entry-main">
                <span className="journal-entry-label">
                  {formatDateKeyFr(day.date)}
                  {day.hasPeriod && ' 🩸'}
                </span>
                <span className="journal-entry-qty">
                  {day.hasData ? `${Math.round(day.calories)} kcal apport` : 'rien noté'}
                </span>
              </div>
              <span className="journal-entry-kcal">
                {day.activities.length > 0 ? `${Math.round(day.activityCalories)} kcal dépensées` : ''}
              </span>
            </div>
            {day.activities.length > 0 && (
              <ul className="activity-summary-list">
                {day.activities.map((a) => (
                  <li key={a.id}>
                    <span>
                      {a.activity_type}
                      {a.training_type && ` · ${TRAINING_TYPES.find((t) => t.value === a.training_type)?.label}`}
                      {a.intensity && ` · ${INTENSITIES.find((i) => i.value === a.intensity)?.label}`}
                    </span>
                    <span className="hint">{a.duration_minutes} min</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
      {!loading && days.length === 0 && <p className="empty">Rien noté pour cette période.</p>}
    </section>
  );
}
