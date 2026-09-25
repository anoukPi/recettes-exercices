import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  addDays,
  daysBetween,
  endOfMonth,
  formatDateKeyFr,
  formatDateRangeFr,
  startOfMonth,
  startOfWeek,
  toDateKey,
} from '../lib/date';
import { usePeriodSummary, type DaySummary } from '../lib/usePeriodSummary';
import { useSession } from '../lib/auth';
import { DailyValueChart } from '../components/DailyValueChart';
import { CriteriaLineChart } from '../components/CriteriaLineChart';
import { FavoritesBar } from '../components/FavoritesBar';
import { useFavorites } from '../lib/useFavorites';
import { useProfiles } from '../lib/profileContext';
import { canTrackCycle } from '../lib/cycle';
import { TrendChart } from '../components/TrendChart';
import { listFitnessTests } from '../api/fitnessTests';
import { definitionFor, TEST_CATEGORIES } from '../lib/fitnessTestCatalog';
import { INTENSITIES, TRAINING_TYPES, type FitnessTest } from '../types';
import type { DailyTargets } from '../lib/dailyNeeds';

type PeriodType = 'semaine' | 'mois';

const TABS = [
  { value: 'bilan', label: 'Bilan' },
  { value: 'stats', label: 'Stat' },
  { value: 'tests', label: 'Test' },
] as const;
type Tab = (typeof TABS)[number]['value'];

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

const fmt = (n: number, digits = 0) =>
  n.toLocaleString('fr-CH', { maximumFractionDigits: digits, minimumFractionDigits: 0 });

function formatGap(gap: number | null, unit: string): string {
  if (gap === null) return '—';
  return `${gap >= 0 ? '+' : ''}${fmt(Math.round(gap))} ${unit}`;
}

/** Dépenses du jour, comme dans le Carnet : métabolisme de base + activité
 * notée, ou dépense totale estimée du profil si aucune activité. */
function expensesFor(d: DaySummary, t: DailyTargets): number {
  return d.activities.length > 0 ? t.bmr_kcal + d.activityCalories : t.tdee_kcal;
}

function activityMinutes(d: DaySummary): number {
  return d.activities.reduce((s, a) => s + a.duration_minutes, 0);
}

function metHours(d: DaySummary): number {
  return d.activities.reduce((s, a) => s + (a.met * a.duration_minutes) / 60, 0);
}

// ---------------------------------------------------------------- BILAN

type Level = 'none' | 'low' | 'ok' | 'over' | 'deficit' | 'act1' | 'act2' | 'act3';

interface CalendarMetric {
  group: 'alimentation' | 'activite';
  label: string;
  emoji: string;
  /** Premières lettres affichées dans la case. */
  abbr: string;
  unit: string;
  target?: (t: DailyTargets) => number;
  value: (d: DaySummary | undefined, t: DailyTargets | null) => number | null;
  /** Critère affiché en texte (ex. noms des activités) plutôt qu'en chiffre :
   * dans le calendrier et dans la lecture du jour, pas en courbe. */
  text?: (d: DaySummary | undefined) => string | null;
  format: (v: number) => string;
  level: (v: number, t: DailyTargets | null) => Level;
  legend: [Level, string][];
}

// Au-dessus de l'objectif (> +10 %) = corail, dans la cible = vert d'eau,
// en dessous (< −10 %) = pétrole clair.
function ratioLevel(v: number, target: number | undefined): Level {
  if (!target) return 'ok';
  const r = v / target;
  if (r > 1.1) return 'over';
  if (r < 0.9) return 'low';
  return 'ok';
}
const RATIO_LEGEND: [Level, string][] = [
  ['low', 'sous l’objectif'],
  ['ok', 'dans l’objectif (±10 %)'],
  ['over', 'au-dessus'],
];
const ACTIVITY_LEGEND: [Level, string][] = [
  ['act1', 'léger'],
  ['act2', 'moyen'],
  ['act3', 'fort'],
];

// Repère ANSES pour les fibres chez l'adulte.
const FIBER_TARGET_G = 30;

function activityNames(d: DaySummary | undefined): string | null {
  if (!d || d.activities.length === 0) return null;
  return Array.from(new Set(d.activities.map((a) => a.activity_type))).join(', ');
}

const LEVEL3 = (a: string, b: string, c: string): [Level, string][] => [
  ['act1', a],
  ['act2', b],
  ['act3', c],
];

const avgOf = (vals: (number | null)[]): number | null => {
  const ok = vals.filter((v): v is number => v !== null);
  return ok.length ? ok.reduce((x, y) => x + y, 0) / ok.length : null;
};

const grams = (v: number) => fmt(Math.round(v));
const grams1 = (v: number) => fmt(v, v < 10 ? 1 : 0);

const CALENDAR_METRICS = {
  // ------------------------------------------------ Alimentation
  calories: {
    group: 'alimentation',
    label: 'Calories du jour',
    emoji: '🍽️',
    abbr: 'Cal',
    unit: 'kcal',
    target: (t) => t.calories_kcal,
    value: (d) => (d?.hasData ? d.calories : null),
    format: (v) => fmt(Math.round(v)),
    level: (v, t) => ratioLevel(v, t?.calories_kcal),
    legend: RATIO_LEGEND,
  },
  ecart: {
    group: 'alimentation',
    label: 'Écart calories',
    emoji: '⚖️',
    abbr: 'Éc',
    unit: 'kcal',
    value: (d, t) => (d?.hasData && t ? d.calories - expensesFor(d, t) : null),
    format: (v) => `${v >= 0 ? '+' : ''}${fmt(Math.round(v))}`,
    level: (v) => (v > 200 ? 'over' : v < -200 ? 'deficit' : 'ok'),
    legend: [
      ['deficit', 'déficit (< −200)'],
      ['ok', 'équilibre (±200)'],
      ['over', 'surplus (> +200)'],
    ],
  },
  proteines: {
    group: 'alimentation',
    label: 'Protéines',
    emoji: '🥩',
    abbr: 'Pro',
    unit: 'g',
    target: (t) => t.protein_g,
    value: (d) => (d?.hasData ? d.protein_g : null),
    format: grams,
    level: (v, t) => ratioLevel(v, t?.protein_g),
    legend: RATIO_LEGEND,
  },
  glucides: {
    group: 'alimentation',
    label: 'Glucides',
    emoji: '🍞',
    abbr: 'Glu',
    unit: 'g',
    target: (t) => t.carbs_g,
    value: (d) => (d?.hasData ? d.carbs_g : null),
    format: grams,
    level: (v, t) => ratioLevel(v, t?.carbs_g),
    legend: RATIO_LEGEND,
  },
  lipides: {
    group: 'alimentation',
    label: 'Lipides',
    emoji: '🥑',
    abbr: 'Lip',
    unit: 'g',
    target: (t) => t.fat_g,
    value: (d) => (d?.hasData ? d.fat_g : null),
    format: grams,
    level: (v, t) => ratioLevel(v, t?.fat_g),
    legend: RATIO_LEGEND,
  },
  fibres: {
    group: 'alimentation',
    label: 'Fibres',
    emoji: '🌾',
    abbr: 'Fib',
    unit: 'g',
    target: () => FIBER_TARGET_G,
    value: (d) => (d?.hasData ? d.fiber_g : null),
    format: grams,
    level: (v) => (v >= FIBER_TARGET_G * 0.9 ? 'ok' : 'low'),
    legend: [
      ['low', `moins de ${Math.round(FIBER_TARGET_G * 0.9)} g`],
      ['ok', `repère ${FIBER_TARGET_G} g atteint`],
    ],
  },
  sucres: {
    group: 'alimentation',
    label: 'Sucres',
    emoji: '🍬',
    abbr: 'Suc',
    unit: 'g',
    value: (d) => (d?.hasData ? d.sugar_g : null),
    format: grams,
    level: (v) => (v > 100 ? 'over' : 'ok'),
    legend: [
      ['ok', '100 g ou moins'],
      ['over', 'plus de 100 g (repère ANSES)'],
    ],
  },
  satures: {
    group: 'alimentation',
    label: 'Graisses saturées',
    emoji: '🧈',
    abbr: 'Sat',
    unit: 'g',
    target: (t) => t.fat_saturated_g,
    value: (d) => (d?.hasData ? d.fat_saturated_g : null),
    format: grams,
    level: (v, t) => (t && v > t.fat_saturated_g * 1.1 ? 'over' : 'ok'),
    legend: [
      ['ok', 'sous le repère'],
      ['over', 'au-dessus'],
    ],
  },
  omega3: {
    group: 'alimentation',
    label: 'Oméga-3',
    emoji: '🐟',
    abbr: 'Ω3',
    unit: 'g',
    target: (t) => t.omega3_g,
    value: (d) => (d?.hasData ? d.omega3_g : null),
    format: grams1,
    level: (v, t) => ratioLevel(v, t?.omega3_g),
    legend: RATIO_LEGEND,
  },
  omega6: {
    group: 'alimentation',
    label: 'Oméga-6',
    emoji: '🌻',
    abbr: 'Ω6',
    unit: 'g',
    target: (t) => t.omega6_g,
    value: (d) => (d?.hasData ? d.omega6_g : null),
    format: grams1,
    level: (v, t) => ratioLevel(v, t?.omega6_g),
    legend: RATIO_LEGEND,
  },
  omega9: {
    group: 'alimentation',
    label: 'Oméga-9',
    emoji: '🫒',
    abbr: 'Ω9',
    unit: 'g',
    target: (t) => t.omega9_g,
    value: (d) => (d?.hasData ? d.omega9_g : null),
    format: grams1,
    level: (v, t) => ratioLevel(v, t?.omega9_g),
    legend: RATIO_LEGEND,
  },
  // ------------------------------------------------ Activité
  depense: {
    group: 'activite',
    label: 'Kcal dépensées (activité)',
    emoji: '🔥',
    abbr: 'Dép',
    unit: 'kcal',
    value: (d) => (d && d.activities.length > 0 ? d.activityCalories : null),
    format: (v) => fmt(Math.round(v)),
    level: (v) => (v >= 400 ? 'act3' : v >= 150 ? 'act2' : 'act1'),
    legend: ACTIVITY_LEGEND,
  },
  met: {
    group: 'activite',
    label: 'MET-heures',
    emoji: '⚡',
    abbr: 'MET',
    unit: 'MET·h',
    value: (d) => (d && d.activities.length > 0 ? metHours(d) : null),
    format: (v) => fmt(v, 1),
    level: (v) => (v >= 6 ? 'act3' : v >= 3 ? 'act2' : 'act1'),
    legend: ACTIVITY_LEGEND,
  },
  minutes: {
    group: 'activite',
    label: 'Minutes d’activité',
    emoji: '⏱️',
    abbr: 'Min',
    unit: 'min',
    value: (d) => (d && d.activities.length > 0 ? activityMinutes(d) : null),
    format: (v) => fmt(Math.round(v)),
    level: (v) => (v >= 60 ? 'act3' : v >= 30 ? 'act2' : 'act1'),
    legend: ACTIVITY_LEGEND,
  },
  seances: {
    group: 'activite',
    label: 'Nombre d’activités',
    emoji: '🏃',
    abbr: 'Nb',
    unit: 'activité(s)',
    value: (d) => (d && d.activities.length > 0 ? d.activities.length : null),
    format: (v) => fmt(v),
    level: (v) => (v >= 3 ? 'act3' : v >= 2 ? 'act2' : 'act1'),
    legend: LEVEL3('1', '2', '3 et plus'),
  },
  forme: {
    group: 'activite',
    label: 'Forme ressentie',
    emoji: '😊',
    abbr: 'For',
    unit: '/5',
    value: (d) => (d ? avgOf(d.activities.map((a) => a.felt_form)) : null),
    format: (v) => fmt(v, 1),
    level: (v) => (v >= 4 ? 'act3' : v >= 3 ? 'act2' : 'act1'),
    legend: LEVEL3('à plat (1-2)', 'correcte (3)', 'en forme (4-5)'),
  },
  effort: {
    group: 'activite',
    label: 'Intensité perçue',
    emoji: '💥',
    abbr: 'Int',
    unit: '/5',
    value: (d) => (d ? avgOf(d.activities.map((a) => a.effort_intensity)) : null),
    format: (v) => fmt(v, 1),
    level: (v) => (v >= 4 ? 'act3' : v >= 3 ? 'act2' : 'act1'),
    legend: LEVEL3('facile (1-2)', 'modérée (3)', 'intense (4-5)'),
  },
  activites: {
    group: 'activite',
    label: 'Activités faites',
    emoji: '🏃',
    abbr: 'Act',
    unit: '',
    value: (d) => (d && d.activities.length > 0 ? d.activities.length : null),
    text: (d) => activityNames(d),
    format: (v) => fmt(v),
    level: (v) => (v >= 3 ? 'act3' : v >= 2 ? 'act2' : 'act1'),
    legend: LEVEL3('1 activité', '2', '3 et plus'),
  },
} satisfies Record<string, CalendarMetric>;
type CalendarMetricKey = keyof typeof CALENDAR_METRICS;
const CALENDAR_KEYS = Object.keys(CALENDAR_METRICS) as CalendarMetricKey[];
const GROUP_LABELS = { alimentation: '🍽️ Alimentation', activite: '🏃 Activité' };
const METRIC_OPTIONS = CALENDAR_KEYS.map((k) => {
  const m: CalendarMetric = CALENDAR_METRICS[k];
  return { key: k, label: m.label, emoji: m.emoji, group: GROUP_LABELS[m.group] };
});
// Pétrole, corail, noir — puis les mêmes en pointillé au-delà de 3 critères.
const CHART_COLORS = ['#0e4e5c', '#ff6f61', '#121212'];

// Petites cases (mois, téléphone) : on raccourcit seulement ce qui ne tient
// pas sur 4 caractères — −2047 → −2k, +1250 → +1,3k ; 1782 reste 1782.
function compact(v: number, format: (v: number) => string): string {
  const tight = format(v).replace(/\s/g, '');
  if (tight.length <= 4 || Math.abs(v) < 1000) return tight;
  const k = (Math.round(v / 100) / 10).toLocaleString('fr-CH');
  return `${v > 0 && format(v).startsWith('+') ? '+' : ''}${k}k`;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function BilanCalendar({
  periodType,
  start,
  end,
  days,
  targets,
}: {
  periodType: PeriodType;
  start: string;
  end: string;
  days: DaySummary[];
  targets: DailyTargets | null;
}) {
  const fav = useFavorites<CalendarMetricKey>(
    'kaly-bilan-favoris',
    CALENDAR_KEYS,
    ['calories', 'ecart', 'depense', 'proteines', 'glucides', 'lipides'],
    ['calories', 'ecart', 'depense'],
  );
  const selected = fav.active;
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [view, setView] = useState<'calendrier' | 'graphique'>(() => {
    try {
      return localStorage.getItem('kaly-bilan-vue') === 'graphique' ? 'graphique' : 'calendrier';
    } catch {
      return 'calendrier';
    }
  });
  const changeView = (v: 'calendrier' | 'graphique') => {
    setView(v);
    try {
      localStorage.setItem('kaly-bilan-vue', v);
    } catch {
      // confort seulement
    }
  };
  const today = toDateKey(new Date());
  const byDate = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);

  const count = daysBetween(start, end) + 1;
  const leading = periodType === 'mois' ? (new Date(`${start}T12:00:00`).getDay() + 6) % 7 : 0;
  const cells: (string | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: count }, (_, i) => addDays(start, i)),
  ];
  const detail = openDay ? byDate.get(openDay) : undefined;
  const dates = cells.filter((c): c is string => c !== null);
  // Un seul graphique : couleurs et traits (plein puis pointillé) selon
  // l'ordre d'affichage, pour que 6 critères restent distincts.
  const numericKeys = selected.filter((k) => !(CALENDAR_METRICS[k] as CalendarMetric).text);
  const textKeys = selected.filter((k) => (CALENDAR_METRICS[k] as CalendarMetric).text);
  const chartTexts = textKeys.map((k) => {
    const m: CalendarMetric = CALENDAR_METRICS[k];
    return { key: k, label: m.label, emoji: m.emoji, values: dates.map((date) => m.text?.(byDate.get(date)) ?? null) };
  });
  const chartSeries = numericKeys.map((k, i) => {
    const m: CalendarMetric = CALENDAR_METRICS[k];
    return {
      key: k,
      label: m.label,
      emoji: m.emoji,
      unit: m.unit,
      format: m.format,
      color: CHART_COLORS[i % CHART_COLORS.length],
      dashed: i >= CHART_COLORS.length,
      target: m.target && targets ? m.target(targets) : null,
      values: dates.map((date) => m.value(byDate.get(date), targets)),
    };
  });

  return (
    <>
      <FavoritesBar
        options={METRIC_OPTIONS}
        favorites={fav.favorites}
        active={fav.active}
        onToggle={(k) => fav.toggle(k as CalendarMetricKey)}
        onRemove={(k) => fav.remove(k as CalendarMetricKey)}
        onAdd={(k) => fav.add(k as CalendarMetricKey)}
      />

      <div className="bilan-period-toggle bilan-view-toggle" role="group" aria-label="Affichage">
        {(
          [
            ['calendrier', '📅 Calendrier'],
            ['graphique', '📈 Graphique'],
          ] as const
        ).map(([v, label]) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            className={view === v ? 'selected' : ''}
            onClick={() => changeView(v)}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'graphique' ? (
        <CriteriaLineChart
          dates={dates}
          series={chartSeries}
          texts={chartTexts}
          openDate={openDay}
          onOpen={(d) => setOpenDay(openDay === d ? null : d)}
        />
      ) : (
        <>
          <div className={`bilan-calendar ${periodType}`}>
            {WEEKDAYS.map((w) => (
              <span key={w} className="bilan-calendar-weekday">
                {periodType === 'mois' ? w.slice(0, 1) : w}
              </span>
            ))}
            {cells.map((date, i) => {
              if (!date) return <span key={`vide-${i}`} />;
              const day = byDate.get(date);
              const empty = !day?.hasData && !day?.activities.length;
              return (
                <button
                  type="button"
                  key={date}
                  className={`bilan-day${date === today ? ' today' : ''}${openDay === date ? ' open' : ''}${empty ? ' empty' : ''}`}
                  onClick={() => setOpenDay(openDay === date ? null : date)}
                  aria-label={formatDateKeyFr(date)}
                >
                  <span className="bilan-day-number">
                    {Number(date.slice(8))}
                    {day?.hasPeriod && <span className="bilan-day-period" title="Règles" />}
                  </span>
                  {!empty &&
                    selected.map((k) => {
                      const m: CalendarMetric = CALENDAR_METRICS[k];
                      const v = m.value(day, targets);
                      return (
                        <span
                          key={k}
                          className={`bilan-pill level-${v === null ? 'none' : m.level(v, targets)}`}
                          title={m.label}
                        >
                          <span className="bilan-pill-label">
                            <span aria-hidden="true">{m.emoji}</span>
                            <span className="bilan-pill-abbr">{m.abbr}</span>
                          </span>
                          {m.text && v !== null ? (
                            <span className="bilan-pill-text">{m.text(day)}</span>
                          ) : v === null ? (
                            <span className="bilan-pill-value">·</span>
                          ) : (
                            <span className="bilan-pill-value">
                              <span className="bilan-pill-full">{m.format(v)}</span>
                              <span className="bilan-pill-compact">{compact(v, m.format)}</span>
                            </span>
                          )}
                        </span>
                      );
                    })}
                </button>
              );
            })}
          </div>

          <ul className="bilan-legend">
            {selected.map((k) => {
              const m: CalendarMetric = CALENDAR_METRICS[k];
              return (
                <li key={k}>
                  <strong>
                    {m.emoji} {m.abbr} = {m.label}
                  </strong>
                  {m.legend.map(([level, text]) => (
                    <span key={level}>
                      <span className={`bilan-swatch level-${level}`} /> {text}
                    </span>
                  ))}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {openDay ? (
        <div className="block b-blanc bilan-day-detail">
          <div className="bilan-day-detail-head">
            <h3>{formatDateKeyFr(openDay)}</h3>
            <Link to={`/journal?date=${openDay}`}>Ouvrir dans le Carnet →</Link>
          </div>
          {detail?.hasData ? (
            <p>
              <strong>{fmt(Math.round(detail.calories))} kcal</strong>
              {targets && <span className="hint"> / objectif {fmt(Math.round(targets.calories_kcal))}</span>}
              <br />
              Protéines {fmt(Math.round(detail.protein_g))} g · Glucides {fmt(Math.round(detail.carbs_g))} g · Lipides{' '}
              {fmt(Math.round(detail.fat_g))} g
              {targets && (
                <>
                  <br />
                  Écart calories {formatGap(detail.calories - expensesFor(detail, targets), 'kcal')}
                </>
              )}
            </p>
          ) : (
            <p className="hint">Aucun repas noté.</p>
          )}
          {detail && detail.activities.length > 0 ? (
            <ul className="activity-summary-list">
              {detail.activities.map((a) => (
                <li key={a.id}>
                  <span>
                    {a.activity_type}
                    {a.training_type && ` · ${TRAINING_TYPES.find((t) => t.value === a.training_type)?.label}`}
                    {a.intensity && ` · ${INTENSITIES.find((x) => x.value === a.intensity)?.label}`}
                  </span>
                  <span className="hint">
                    {a.duration_minutes} min · MET {fmt(a.met, 1)} · {fmt(Math.round(a.calories_kcal))} kcal
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="hint">Aucune activité notée.</p>
          )}
        </div>
      ) : (
        <p className="hint">
          Touche un jour (ou une colonne du graphique) pour voir le détail de l’alimentation et de l’activité.
        </p>
      )}
    </>
  );
}

// ---------------------------------------------------------------- STAT

const STAT_OPTIONS = [
  { value: 'proteines', label: 'Protéines', emoji: '🥩', group: '🍽️ Alimentation' },
  { value: 'glucides', label: 'Glucides', emoji: '🍞', group: '🍽️ Alimentation' },
  { value: 'lipides', label: 'Lipides', emoji: '🥑', group: '🍽️ Alimentation' },
  { value: 'calories', label: 'Calories', emoji: '🍽️', group: '🍽️ Alimentation' },
  { value: 'fibres', label: 'Fibres', emoji: '🌾', group: '🍽️ Alimentation' },
  { value: 'sucres', label: 'Sucres', emoji: '🍬', group: '🍽️ Alimentation' },
  { value: 'satures', label: 'Graisses saturées', emoji: '🧈', group: '🍽️ Alimentation' },
  { value: 'omegas', label: 'Oméga 3·6·9', emoji: '🐟', group: '🍽️ Alimentation' },
  { value: 'entrainements', label: 'Entraînements', emoji: '🏋️', group: '🏃 Activité' },
  { value: 'activite', label: 'Activités pratiquées', emoji: '🏃', group: '🏃 Activité' },
  { value: 'depense', label: 'Kcal dépensées', emoji: '🔥', group: '🏃 Activité' },
  { value: 'minutes', label: 'Temps d’activité', emoji: '⏱️', group: '🏃 Activité' },
  { value: 'regularite', label: 'Jours actifs', emoji: '📅', group: '🏃 Activité' },
  { value: 'regles', label: 'Règles', emoji: '🩸', group: '🌙 Cycle' },
] as const;
type StatKey = (typeof STAT_OPTIONS)[number]['value'];
const STAT_KEYS = STAT_OPTIONS.map((o) => o.value);

const CURVES = {
  proteines: { label: 'Protéines', unit: 'g', value: (d: DaySummary) => d.protein_g, food: true },
  glucides: { label: 'Glucides', unit: 'g', value: (d: DaySummary) => d.carbs_g, food: true },
  lipides: { label: 'Lipides', unit: 'g', value: (d: DaySummary) => d.fat_g, food: true },
  calories: { label: 'Calories', unit: 'kcal', value: (d: DaySummary) => d.calories, food: true },
  ecart: { label: 'Écart calories', unit: 'kcal', value: (d: DaySummary) => d.calories, food: true },
  depense: { label: 'Kcal dépensées', unit: 'kcal', value: (d: DaySummary) => d.activityCalories, food: false },
  minutes: { label: 'Minutes d’activité', unit: 'min', value: activityMinutes, food: false },
  omega3: { label: 'Oméga-3', unit: 'g', value: (d: DaySummary) => d.omega3_g, food: true },
};
type CurveKey = keyof typeof CURVES;

function curveTarget(key: CurveKey, t: DailyTargets | null): number | null {
  if (!t) return null;
  switch (key) {
    case 'proteines':
      return t.protein_g;
    case 'glucides':
      return t.carbs_g;
    case 'lipides':
      return t.fat_g;
    case 'calories':
      return t.calories_kcal;
    case 'omega3':
      return t.omega3_g;
    default:
      return null;
  }
}

// Exemples d'aliments riches, pour savoir quoi ajouter si la moyenne est basse.
const OMEGA_SOURCES = {
  omega3: 'noix, graines de lin et de chia, huile de colza, sardine, maquereau, saumon',
  omega6: 'huile de tournesol, graines de tournesol et de courge, noix, pignons',
  omega9: "huile d'olive, avocat, amandes, noisettes, noix de cajou, huile de colza",
};

function MacroStat({ label, values, target }: { label: string; values: number[]; target?: number }) {
  const avg = average(values);
  return (
    <div className="bilan-stat-card">
      <span className="bilan-stat-label">{label} (moyenne/jour)</span>
      <span className="bilan-stat-value">{avg === null ? '—' : `${fmt(Math.round(avg))} g`}</span>
      {avg !== null && target ? <span className="hint">objectif {fmt(Math.round(target))} g</span> : null}
    </div>
  );
}

function StatsView({
  days,
  targets,
  start,
  count,
}: {
  days: DaySummary[];
  targets: DailyTargets | null;
  start: string;
  count: number;
}) {
  const fav = useFavorites<StatKey>(
    'kaly-bilan-stats-favoris',
    STAT_KEYS,
    ['proteines', 'glucides', 'lipides', 'entrainements', 'activite'],
    ['proteines', 'glucides', 'lipides', 'entrainements', 'activite'],
  );
  const [curve, setCurve] = useState<CurveKey>('proteines');
  // « Règles » : seulement pour les femmes majeures.
  const cycleOn = canTrackCycle(useProfiles().active);

  const s = useMemo(() => {
    const food = days.filter((d) => d.hasData);
    const activities = days.flatMap((d) => d.activities);
    const byType = new Map<string, { count: number; minutes: number }>();
    for (const a of activities) {
      const cur = byType.get(a.activity_type) ?? { count: 0, minutes: 0 };
      byType.set(a.activity_type, { count: cur.count + 1, minutes: cur.minutes + a.duration_minutes });
    }
    const ranking = Array.from(byType.entries()).sort((a, b) => b[1].count - a[1].count || b[1].minutes - a[1].minutes);
    return {
      food,
      activities,
      ranking,
      activeDays: days.filter((d) => d.activities.length > 0).length,
      minutes: activities.reduce((sum, a) => sum + a.duration_minutes, 0),
      spent: activities.reduce((sum, a) => sum + a.calories_kcal, 0),
      caloriesGaps: targets ? food.map((d) => d.calories - expensesFor(d, targets)) : [],
      periodDates: days.filter((d) => d.hasPeriod).map((d) => d.date),
    };
  }, [days, targets]);

  const on = (k: StatKey) => fav.active.includes(k) && (cycleOn || k !== 'regles');
  const curveDef = CURVES[curve];
  const byDate = new Map(days.map((d) => [d.date, d]));

  return (
    <>
      <FavoritesBar
        options={STAT_OPTIONS.filter((o) => cycleOn || o.value !== 'regles').map((o) => ({
          key: o.value,
          label: o.label,
          emoji: o.emoji,
          group: o.group,
        }))}
        favorites={fav.favorites}
        active={fav.active}
        onToggle={(k) => fav.toggle(k as StatKey)}
        onRemove={(k) => fav.remove(k as StatKey)}
        onAdd={(k) => fav.add(k as StatKey)}
        noun="statistique"
        feminine
      />

      <div className="bilan-stat-grid">
        {on('proteines') && (
          <MacroStat label="Protéines" values={s.food.map((d) => d.protein_g)} target={targets?.protein_g} />
        )}
        {on('glucides') && (
          <MacroStat label="Glucides" values={s.food.map((d) => d.carbs_g)} target={targets?.carbs_g} />
        )}
        {on('lipides') && <MacroStat label="Lipides" values={s.food.map((d) => d.fat_g)} target={targets?.fat_g} />}
        {on('fibres') && <MacroStat label="Fibres" values={s.food.map((d) => d.fiber_g)} target={FIBER_TARGET_G} />}
        {on('sucres') && <MacroStat label="Sucres" values={s.food.map((d) => d.sugar_g)} />}
        {on('satures') && (
          <MacroStat
            label="Graisses saturées"
            values={s.food.map((d) => d.fat_saturated_g)}
            target={targets?.fat_saturated_g}
          />
        )}
        {on('entrainements') && (
          <div className="bilan-stat-card">
            <span className="bilan-stat-label">Entraînements</span>
            <span className="bilan-stat-value">{s.activities.length}</span>
            <span className="hint">
              sur {s.activeDays} jour{s.activeDays > 1 ? 's' : ''} actif{s.activeDays > 1 ? 's' : ''}
            </span>
          </div>
        )}
        {on('activite') && (
          <div className="bilan-stat-card bilan-stat-wide">
            <span className="bilan-stat-label">Activités pratiquées</span>
            {s.ranking.length > 0 ? (
              <ol className="bilan-activity-ranking">
                {s.ranking.map(([name, v]) => (
                  <li key={name}>
                    <span>{name}</span>
                    <span className="hint">{fmt(Math.round(v.minutes))} min</span>
                    <strong>{v.count}×</strong>
                  </li>
                ))}
              </ol>
            ) : (
              <span className="bilan-stat-value">—</span>
            )}
          </div>
        )}
        {on('calories') && (
          <div className="bilan-stat-card">
            <span className="bilan-stat-label">Calories (moyenne/jour)</span>
            <span className="bilan-stat-value">
              {s.food.length ? `${fmt(Math.round(average(s.food.map((d) => d.calories)) ?? 0))} kcal` : '—'}
            </span>
            <span className="hint">écart moyen aux dépenses {formatGap(average(s.caloriesGaps), 'kcal')}</span>
          </div>
        )}
        {on('depense') && (
          <div className="bilan-stat-card">
            <span className="bilan-stat-label">Kcal dépensées en activité</span>
            <span className="bilan-stat-value">{fmt(Math.round(s.spent))} kcal</span>
          </div>
        )}
        {on('minutes') && (
          <div className="bilan-stat-card">
            <span className="bilan-stat-label">Temps d’activité</span>
            <span className="bilan-stat-value">
              {Math.floor(s.minutes / 60)} h {String(Math.round(s.minutes % 60)).padStart(2, '0')}
            </span>
          </div>
        )}
        {on('omegas') &&
          (
            [
              ['Oméga-3', average(s.food.map((d) => d.omega3_g)), targets?.omega3_g, OMEGA_SOURCES.omega3],
              ['Oméga-6', average(s.food.map((d) => d.omega6_g)), targets?.omega6_g, OMEGA_SOURCES.omega6],
              ['Oméga-9', average(s.food.map((d) => d.omega9_g)), targets?.omega9_g, OMEGA_SOURCES.omega9],
            ] as const
          ).map(([label, avg, target, sources]) => (
            <div className="bilan-stat-card" key={label}>
              <span className="bilan-stat-label">{label} (moyenne/jour)</span>
              <span className="bilan-stat-value">{avg === null ? '—' : `${fmt(avg, 1)} g`}</span>
              {target ? <span className="hint">repère {fmt(target, 1)} g</span> : null}
              <span className="bilan-stat-sources">On en trouve dans : {sources}</span>
            </div>
          ))}
        {on('regularite') && (
          <div className="bilan-stat-card">
            <span className="bilan-stat-label">Jours actifs</span>
            <span className="bilan-stat-value">{count > 0 ? Math.round((s.activeDays / count) * 100) : 0} %</span>
            <span className="hint">
              {s.activeDays}/{count} jours
            </span>
          </div>
        )}
        {on('regles') && (
          <div className="bilan-stat-card">
            <span className="bilan-stat-label">Règles</span>
            <span className="bilan-stat-value">
              {s.periodDates.length > 0 ? (
                s.periodDates.map((d) => formatDateKeyFr(d)).join(', ')
              ) : (
                <span className="hint">Aucune notée cette période</span>
              )}
            </span>
          </div>
        )}
      </div>

      <div className="block b-blanc bilan-curve">
        <div className="journal-meal-picker">
          <label htmlFor="bilan-curve">Courbe :</label>
          <select id="bilan-curve" value={curve} onChange={(e) => setCurve(e.target.value as CurveKey)}>
            {(Object.keys(CURVES) as CurveKey[]).map((k) => (
              <option key={k} value={k}>
                {CURVES[k].label}
              </option>
            ))}
          </select>
        </div>
        <DailyValueChart
          unit={curveDef.unit}
          signed={curve === 'ecart'}
          target={curveTarget(curve, targets)}
          data={Array.from({ length: count }, (_, i) => {
            const date = addDays(start, i);
            const d = byDate.get(date);
            if (curve === 'ecart')
              return { date, value: d?.hasData && targets ? d.calories - expensesFor(d, targets) : null };
            if (!d) return { date, value: curveDef.food ? null : 0 };
            return { date, value: curveDef.food && !d.hasData ? null : curveDef.value(d) };
          })}
        />
        {curve === 'ecart' && (
          <p className="hint">Écart = apport − dépenses (métabolisme de base + activité, comme dans le Carnet).</p>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------- TEST

function TestsEvolution() {
  const [tests, setTests] = useState<FitnessTest[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listFitnessTests()
      .then((t) => {
        if (!cancelled) setTests(t);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur de chargement');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!tests) return <p>Chargement…</p>;
  return <TestsFavorites tests={tests} />;
}

const CATEGORY_EMOJI: Record<string, string> = {
  mesures: '📏',
  force: '💪',
  souplesse: '🤸',
  endurance: '❤️',
};

function TestsFavorites({ tests }: { tests: FitnessTest[] }) {
  // Tous les tests du catalogue + ceux notés hors catalogue, par catégorie.
  const options = useMemo(() => {
    const opts = TEST_CATEGORIES.flatMap((c) =>
      c.tests.map((t) => ({ key: t.name, label: t.name, emoji: CATEGORY_EMOJI[c.value] ?? '📈', group: c.label })),
    );
    const known = new Set(opts.map((o) => o.key.toLowerCase()));
    for (const name of new Set(tests.map((t) => t.test_name))) {
      if (!known.has(name.toLowerCase())) opts.push({ key: name, label: name, emoji: '📈', group: 'Autres' });
    }
    return opts;
  }, [tests]);
  const keys = options.map((o) => o.key);
  // Présélection : les tests déjà faits, les plus récents d'abord.
  const withData = Array.from(new Set([...tests].reverse().map((t) => t.test_name))).filter((n) => keys.includes(n));
  const fav = useFavorites<string>('kaly-bilan-tests-favoris', keys, withData.slice(0, 6), withData.slice(0, 6));

  return (
    <>
      <FavoritesBar
        options={options}
        favorites={fav.favorites}
        active={fav.active}
        onToggle={fav.toggle}
        onRemove={fav.remove}
        onAdd={fav.add}
        noun="test"
      />
      {fav.active.length === 0 ? (
        <p className="empty">
          {tests.length === 0
            ? 'Aucun test pour l’instant : fais-en un depuis le bouton +, et ajoute ici ceux à suivre.'
            : 'Ajoute un test à tes favoris pour voir sa courbe.'}
        </p>
      ) : (
        <div className="bilan-test-grid">
          {fav.active.map((name) => {
            const entries = tests.filter((t) => t.test_name.toLowerCase() === name.toLowerCase());
            const def = definitionFor(name);
            const emoji = options.find((o) => o.key === name)?.emoji ?? '📈';
            if (entries.length === 0) {
              return (
                <div key={name} className="block b-blanc bilan-test-card">
                  <div className="bilan-test-head">
                    <strong>
                      {emoji} {name}
                    </strong>
                    <span className="hint">{def?.unit}</span>
                  </div>
                  <p className="hint">Pas encore de résultat : fais ce test depuis le bouton +.</p>
                </div>
              );
            }
            const first = entries[0];
            const last = entries[entries.length - 1];
            const delta = entries.length > 1 ? last.value - first.value : null;
            const good =
              delta === null || !def || def.better === 'neutre' || delta === 0
                ? null
                : (def.better === 'plus') === delta > 0;
            return (
              <div key={name} className="block b-blanc bilan-test-card">
                <div className="bilan-test-head">
                  <strong>
                    {emoji} {name}
                  </strong>
                  <span>
                    {fmt(last.value, 2)} {last.unit}
                  </span>
                </div>
                {delta !== null && (
                  <p className={`test-delta${good === true ? ' good' : good === false ? ' bad' : ''}`}>
                    {delta > 0 ? '+' : ''}
                    {fmt(delta, 2)} {last.unit} depuis le{' '}
                    {new Date(`${first.entry_date}T12:00:00`).toLocaleDateString('fr-CH')}
                  </p>
                )}
                {entries.length > 1 ? (
                  <TrendChart points={entries.map((e) => ({ date: e.entry_date, value: e.value }))} unit={last.unit} />
                ) : (
                  <p className="hint">
                    Un seul résultat ({new Date(`${last.entry_date}T12:00:00`).toLocaleDateString('fr-CH')}) : la courbe
                    apparaîtra au prochain test.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------- Page

export function BilanPage() {
  const { session, loading: authLoading } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get('onglet');
  const tab: Tab = TABS.some((t) => t.value === requested) ? (requested as Tab) : 'bilan';
  const [periodType, setPeriodType] = useState<PeriodType>('semaine');
  const [anchor, setAnchor] = useState(toDateKey(new Date()));

  const { start, end } = computeRange(periodType, anchor);
  const { days, dailyTargets, loading } = usePeriodSummary(start, end);
  const count = daysBetween(start, end) + 1;

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
    <section className="journal bilan-page">
      <h2>Bilan</h2>
      <div className="section-tabs" role="tablist" aria-label="Bilan">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={tab === t.value}
            className={`tag-chip${tab === t.value ? ' selected' : ''}`}
            onClick={() => setSearchParams({ onglet: t.value })}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'tests' ? (
        <TestsEvolution />
      ) : (
        <>
          <div className="bilan-period">
            <div className="bilan-period-toggle" role="group" aria-label="Vue">
              {(['semaine', 'mois'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-pressed={periodType === p}
                  className={periodType === p ? 'selected' : ''}
                  onClick={() => setPeriodType(p)}
                >
                  {p === 'semaine' ? 'Semaine' : 'Mois'}
                </button>
              ))}
            </div>
            <div className="journal-date-nav">
              <button
                type="button"
                onClick={() => setAnchor(shiftAnchor(periodType, anchor, -1))}
                aria-label="Période précédente"
              >
                ←
              </button>
              <strong>{formatDateRangeFr(start, end)}</strong>
              <button
                type="button"
                onClick={() => setAnchor(shiftAnchor(periodType, anchor, 1))}
                aria-label="Période suivante"
              >
                →
              </button>
            </div>
          </div>

          {loading && <p>Chargement…</p>}
          {!dailyTargets && !loading && (
            <p className="hint">
              Renseigne ton <Link to="/settings?onglet=profil">profil dans les Paramètres</Link> pour voir les écarts
              par rapport à tes objectifs.
            </p>
          )}

          {!loading && tab === 'bilan' && (
            <BilanCalendar periodType={periodType} start={start} end={end} days={days} targets={dailyTargets} />
          )}
          {!loading && tab === 'stats' && <StatsView days={days} targets={dailyTargets} count={count} start={start} />}
        </>
      )}
    </section>
  );
}
