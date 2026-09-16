import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { addDays, formatDateKeyFr, toDateKey } from '../lib/date';
import { useDayNutrition } from '../lib/useDayNutrition';
import { useSession } from '../lib/auth';
import { MonthCalendar } from '../components/MonthCalendar';
import { listCycleEntries } from '../api/cycle';
import { isIronReminderDay } from '../lib/cycle';
import type { CycleEntry, NutritionTotals } from '../types';

const GI_BANDS: { max: number; label: string; className: string }[] = [
  { max: 35, label: 'très bas', className: 'gi-very-low' },
  { max: 55, label: 'bas', className: 'gi-low' },
  { max: 70, label: 'modéré', className: 'gi-moderate' },
  { max: Infinity, label: 'élevé', className: 'gi-high' },
];

// Seuils courants pour une charge glycémique cumulée sur une journée entière
// (repère large communément cité dans la littérature sur l'indice
// glycémique — pas une valeur clinique précise, juste un ordre de grandeur).
const CG_DAY_BANDS: { max: number; label: string; className: string }[] = [
  { max: 80, label: 'faible', className: 'gi-very-low' },
  { max: 120, label: 'modérée', className: 'gi-moderate' },
  { max: Infinity, label: 'élevée', className: 'gi-high' },
];

function cgAppreciation(dayCg: number): { label: string; className: string } {
  const band = CG_DAY_BANDS.find((b) => dayCg < b.max) ?? CG_DAY_BANDS[CG_DAY_BANDS.length - 1];
  return { label: band.label, className: band.className };
}

function giAppreciation(avgGi: number): { label: string; className: string } {
  const band = GI_BANDS.find((b) => avgGi < b.max) ?? GI_BANDS[GI_BANDS.length - 1];
  return { label: band.label, className: band.className };
}

type MicroLabel = { key: keyof NutritionTotals; label: string; unit: string };

const MICRO_GROUPS: { title: string; items: MicroLabel[] }[] = [
  {
    title: 'Autres',
    items: [
      { key: 'fiber_g', label: 'Fibres', unit: 'g' },
      { key: 'sugar_g', label: 'Sucres', unit: 'g' },
    ],
  },
  {
    title: 'Minéraux',
    items: [
      { key: 'sodium_mg', label: 'Sodium', unit: 'mg' },
      { key: 'calcium_mg', label: 'Calcium', unit: 'mg' },
      { key: 'iron_mg', label: 'Fer', unit: 'mg' },
      { key: 'potassium_mg', label: 'Potassium', unit: 'mg' },
      { key: 'magnesium_mg', label: 'Magnésium', unit: 'mg' },
      { key: 'zinc_mg', label: 'Zinc', unit: 'mg' },
    ],
  },
  {
    title: 'Vitamines',
    items: [
      { key: 'vitamin_a_mcg', label: 'Vitamine A', unit: 'µg' },
      { key: 'vitamin_c_mg', label: 'Vitamine C', unit: 'mg' },
      { key: 'vitamin_d_mcg', label: 'Vitamine D', unit: 'µg' },
      { key: 'vitamin_e_mg', label: 'Vitamine E', unit: 'mg' },
      { key: 'vitamin_b12_mcg', label: 'Vitamine B12', unit: 'µg' },
    ],
  },
];

interface MeterStatus {
  percent: number;
  className: 'meter-under' | 'meter-ok' | 'meter-over' | 'meter-far';
}

/** Best-effort : pas un jugement médical, juste un repère visuel — en dessous
 * de 60% ou au-dessus de 140% de l'objectif, l'écart est mis en avant. */
function meterStatus(actual: number, target: number): MeterStatus {
  const pct = target > 0 ? (actual / target) * 100 : 0;
  let className: MeterStatus['className'] = 'meter-ok';
  if (pct < 60 || pct > 140) className = 'meter-far';
  else if (pct < 85 || pct > 115) className = pct < 85 ? 'meter-under' : 'meter-over';
  return { percent: Math.min(pct, 100), className };
}

function MacroMeter({
  label,
  actual,
  target,
  unit,
}: {
  label: string;
  actual: number;
  target: number | undefined;
  unit: string;
}) {
  const status = target ? meterStatus(actual, target) : null;
  return (
    <div className="meter-row">
      <div className="meter-row-header">
        <span>{label}</span>
        <span className="meter-row-value">
          {Math.round(actual)}
          {target ? ` / ${Math.round(target)} ${unit}` : ` ${unit}`}
        </span>
      </div>
      {status && (
        <div className="meter-track">
          <div className={`meter-fill ${status.className}`} style={{ width: `${status.percent}%` }} />
        </div>
      )}
    </div>
  );
}

export function JournalPage() {
  const { session, loading: authLoading } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const dateKey = searchParams.get('date') || toDateKey(new Date());
  const setDateKey = (next: string) => setSearchParams({ date: next });
  const [showCalendar, setShowCalendar] = useState(false);
  const [monthKey, setMonthKey] = useState(dateKey.slice(0, 7));
  const [cycleEntries, setCycleEntries] = useState<CycleEntry[]>([]);

  const { loading, error, profile, dailyTargets, dayTotals, dayGi, bilan } = useDayNutrition(dateKey);

  useEffect(() => {
    if (!session) return;
    listCycleEntries().then(setCycleEntries).catch(() => {});
  }, [session]);

  const ironReminder = isIronReminderDay(dateKey, cycleEntries);

  if (authLoading) return null;

  if (!session) {
    return (
      <section className="journal">
        <p className="hint">
          Connecte-toi dans <Link to="/settings">Paramètres</Link> pour voir ton carnet.
        </p>
      </section>
    );
  }

  return (
    <section className="journal">
      <div className="journal-date-nav">
        <button type="button" onClick={() => setDateKey(addDays(dateKey, -1))}>
          ← Veille
        </button>
        <div className="journal-date-label">
          <strong>{formatDateKeyFr(dateKey)}</strong>
          <input
            type="date"
            className="journal-date-picker"
            value={dateKey}
            max={toDateKey(new Date())}
            onChange={(e) => e.target.value && setDateKey(e.target.value)}
          />
          {dateKey !== toDateKey(new Date()) && (
            <button type="button" className="link-button" onClick={() => setDateKey(toDateKey(new Date()))}>
              Revenir à aujourd'hui
            </button>
          )}
        </div>
        <button type="button" onClick={() => setDateKey(addDays(dateKey, 1))}>
          Lendemain →
        </button>
      </div>

      <button
        type="button"
        className="link-button"
        onClick={() => {
          setShowCalendar((v) => !v);
          setMonthKey(dateKey.slice(0, 7));
        }}
      >
        {showCalendar ? 'Masquer le calendrier' : 'Voir le calendrier du mois'}
      </button>

      {showCalendar && (
        <MonthCalendar
          monthKey={monthKey}
          selectedDate={dateKey}
          onSelectDate={(d) => {
            setDateKey(d);
            setShowCalendar(false);
          }}
          onChangeMonth={setMonthKey}
        />
      )}

      {loading && <p>Chargement…</p>}
      {error && <p className="error">{error}</p>}

      <div className="journal-summary">
        <div className="journal-summary-hero">
          <span className="journal-summary-value">{Math.round(dayTotals.totals.calories_kcal)}</span>
          <span className="journal-summary-unit">
            {dailyTargets ? `/ ${Math.round(dailyTargets.calories_kcal)} kcal` : 'kcal'}
          </span>
        </div>
        <div className="meter-group">
          <MacroMeter label="Protéines" actual={dayTotals.totals.protein_g} target={dailyTargets?.protein_g} unit="g" />
          <MacroMeter label="Glucides" actual={dayTotals.totals.carbs_g} target={dailyTargets?.carbs_g} unit="g" />
          <MacroMeter label="Lipides" actual={dayTotals.totals.fat_g} target={dailyTargets?.fat_g} unit="g" />
        </div>
        <p className="hint">
          Charge glycémique du jour : {Math.round(dayTotals.totals.glycemic_load)}
        </p>
        {!profile && (
          <p className="hint">
            Renseigne ton{' '}
            <Link to="/settings">profil dans les Paramètres</Link> pour voir tes objectifs
            journaliers ici.
          </p>
        )}
        {dailyTargets?.flooredBySafety && (
          <p className="hint warning-hint">
            ⚠️ Ton objectif calculé était en dessous du plancher de sécurité — il a été ajusté au
            minimum recommandé. Si tu vises une perte de poids plus rapide, mieux vaut en parler à
            un professionnel de santé qu'ajuster ce chiffre.
          </p>
        )}
        {ironReminder && (
          <p className="hint warning-hint">
            🩸 Règles en cours — pense à surveiller ton apport en fer ces jours-ci (pertes de sang).{' '}
            <Link to="/cycle">Gérer le suivi du cycle</Link>
          </p>
        )}
        {dayGi !== null && (
          <>
            <p className={`gi-appreciation ${cgAppreciation(dayTotals.totals.glycemic_load).className}`}>
              Charge glycémique du jour : {Math.round(dayTotals.totals.glycemic_load)} (
              {cgAppreciation(dayTotals.totals.glycemic_load).label})
            </p>
            <p className="hint">
              IG moyen du jour : {Math.round(dayGi)} ({giAppreciation(dayGi).label})
            </p>
            <details className="gi-explainer">
              <summary>ℹ️ IG vs charge glycémique — quelle différence ?</summary>
              <p className="hint">
                <strong>IG (indice glycémique)</strong> : vitesse à laquelle un aliment fait monter
                la glycémie — fixe pour cet aliment, peu importe la quantité mangée.
                <br />
                <strong>Charge glycémique (CG)</strong> : IG × la quantité de glucides réellement
                mangée. C'est l'impact réel sur ta glycémie de ta portion, pas juste de l'aliment en
                général — deux portions différentes du même aliment ont le même IG mais pas la même
                CG.
              </p>
            </details>
          </>
        )}
        {bilan && (
          <p className="hint bilan-line">
            Dépenses : {Math.round(bilan.expenses)} kcal — métabolisme de base{' '}
            {Math.round(bilan.bmr)} kcal
            {bilan.measured ? (
              <>
                {' '}
                + <Link to="/activity">activité loguée</Link> {Math.round(bilan.activityCalories)}{' '}
                kcal
              </>
            ) : (
              <>
                {' '}
                × niveau d'activité du profil (estimation — logue une activité pour un bilan basé
                sur du réel)
              </>
            )}
            {' · '}Écart : {bilan.gap >= 0 ? '+' : ''}
            {Math.round(bilan.gap)} kcal
          </p>
        )}
        {(dayTotals.hasPartial || dayTotals.hasWarning) && (
          <p className="hint warning-hint">
            Certaines lignes du détail des repas sont des estimations approximatives, ou affichent
            "?" quand aucune valeur n'a pu être calculée.
          </p>
        )}
        {dayTotals.hasAny && (
          <details className="journal-micro-details">
            <summary>Micronutriments</summary>
            {MICRO_GROUPS.map(({ title, items }) => (
              <div key={title} className="journal-micro-group">
                <h5>{title}</h5>
                <ul className="journal-micro-list">
                  {items.map(({ key, label, unit }) => (
                    <li key={key}>
                      <span>{label}</span>
                      <span>
                        {Math.round(dayTotals.totals[key] * 10) / 10} {unit}
                      </span>
                    </li>
                  ))}
                  {title === 'Minéraux' && (
                    <li>
                      <span>Sel</span>
                      <span>{Math.round(((dayTotals.totals.sodium_mg * 2.5) / 1000) * 10) / 10} g</span>
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </details>
        )}
      </div>

      <Link className="button" to={`/repas?date=${dateKey}`}>
        Voir / modifier les repas de ce jour
      </Link>
    </section>
  );
}
