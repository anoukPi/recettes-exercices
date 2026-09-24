import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { addDays, formatDateKeyFr, toDateKey } from '../lib/date';
import { useDayNutrition } from '../lib/useDayNutrition';
import { OMEGA6_OMEGA3_RATIO_MAX, targetsBlockedReason, type DailyTargets } from '../lib/dailyNeeds';
import { useSession } from '../lib/auth';
import { MonthCalendar } from '../components/MonthCalendar';
import { listCycleEntries } from '../api/cycle';
import { getProfile } from '../api/profile';
import { isLutealPhase, isOnPeriod } from '../lib/cycle';
import { addWaterEntry, deleteWaterEntry, listWaterEntries } from '../api/water';
import {
  BEVERAGE_TYPES,
  INTENSITIES,
  TRAINING_TYPES,
  type BeverageType,
  type CycleEntry,
  type NutritionTotals,
  type Profile,
  type WaterEntry,
} from '../types';

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

// Apports de référence (ANSES/EFSA, femme adulte) — repères indicatifs, pas
// une prescription individuelle. Le fer reflète déjà les pertes menstruelles
// moyennes (d'où le rappel spécifique pendant les règles plutôt qu'une cible
// qui grimperait encore plus ce jour-là). La vitamine C aide l'absorption du
// fer non héminique (végétal) — utile de les regarder ensemble.
const CYCLE_NUTRIENT_TARGETS = {
  iron_mg: 16,
  vitamin_c_mg: 110,
  magnesium_mg: 300,
  omega3_g: 1.1,
};
// Repère courant pour le magnésium en phase lutéale (crampes, rétention...) —
// pas de cible officielle distincte, juste un peu de marge indicative.
const LUTEAL_MAGNESIUM_EXTRA_MG = 30;

const WATER_GLASS_ML = 250;
const TASSE_ML = 150;
const LITRE_ML = 1000;
type BeverageUnit = 'tasse' | 'litre';
const BEVERAGE_UNITS_BY_TYPE: Record<BeverageType, BeverageUnit[]> = {
  eau: ['tasse', 'litre'],
  café: ['tasse'],
  thé: ['tasse', 'litre'],
  tisane: ['tasse', 'litre'],
};

// Repère courant en nutrition clinique : ~1 mL d'eau par kcal dépensée —
// englobe naturellement âge, taille, sexe, poids (via le BMR) et niveau
// d'activité (via la dépense totale), plutôt qu'un simple ratio au poids.
// Plancher de sécurité si le profil est incomplet.
const ML_PER_KCAL = 1;
const WATER_TARGET_FLOOR_ML = 1500;

function waterTarget(profile: Profile | null, dailyTargets: DailyTargets | null): number {
  if (dailyTargets) {
    return Math.max(WATER_TARGET_FLOOR_ML, Math.round(dailyTargets.tdee_kcal * ML_PER_KCAL));
  }
  return profile?.weight_kg ? Math.round(profile.weight_kg * 30) : 2000;
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
    title: 'Lipides (détail)',
    items: [
      { key: 'fat_monounsaturated_g', label: 'Mono-insaturés', unit: 'g' },
      { key: 'fat_polyunsaturated_g', label: 'Poly-insaturés', unit: 'g' },
      { key: 'omega3_g', label: 'Oméga-3', unit: 'g' },
      { key: 'omega6_g', label: 'Oméga-6', unit: 'g' },
      { key: 'omega9_g', label: 'Oméga-9', unit: 'g' },
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

/** Best-effort : pas un jugement médical, juste un repère visuel. Seul un
 * dépassement est mis en avant (corail) : être en dessous de l'objectif en
 * cours de journée est normal, pas une alerte (revue UX : bilan jamais
 * culpabilisant). */
function meterStatus(actual: number, target: number): MeterStatus {
  const pct = target > 0 ? (actual / target) * 100 : 0;
  let className: MeterStatus['className'] = 'meter-ok';
  if (pct > 140) className = 'meter-far';
  else if (pct > 115) className = 'meter-over';
  else if (pct < 85) className = 'meter-under';
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
  // Petites quantités (oméga-3…) : une décimale, sinon « 1 / 3 g » ne dit rien.
  const decimals = target !== undefined && target < 10 ? 1 : 0;
  const fmt = (v: number) => v.toLocaleString('fr-CH', { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
  return (
    <div className="meter-row">
      <div className="meter-row-header">
        <span>{label}</span>
        <span className="meter-row-value">
          {fmt(actual)}
          {target ? ` / ${fmt(target)} ${unit}` : ` ${unit}`}
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
  const [periodLengthDays, setPeriodLengthDays] = useState<number | null>(null);
  const [waterEntries, setWaterEntries] = useState<WaterEntry[]>([]);
  const [beverageType, setBeverageType] = useState<BeverageType>('eau');
  const [beverageQty, setBeverageQty] = useState('1');
  const [beverageUnit, setBeverageUnit] = useState<BeverageUnit>('tasse');

  useEffect(() => {
    if (!session) return;
    listCycleEntries().then(setCycleEntries).catch(() => {});
    // Fetch séparé du profil (léger) : nécessaire avant même d'appeler
    // useDayNutrition, qui a besoin de l'ajustement calorique de phase
    // lutéale en entrée plutôt qu'en sortie.
    getProfile()
      .then((p) => setPeriodLengthDays(p?.period_length_days ?? null))
      .catch(() => {});
  }, [session]);

  const onPeriod = isOnPeriod(dateKey, cycleEntries, periodLengthDays);
  const lutealPhase = isLutealPhase(dateKey, cycleEntries, periodLengthDays);
  // Repère courant : ~100-300 kcal/jour en plus pendant la semaine précédant
  // les règles (phase lutéale), pas pendant les règles elles-mêmes — 200
  // comme milieu de fourchette, pas une mesure individuelle.
  const lutealPhaseExtraKcal = lutealPhase ? 200 : 0;

  const { loading, error, profile, dailyTargets, dayTotals, dayGi, bilan, activityEntries } =
    useDayNutrition(dateKey, lutealPhaseExtraKcal);

  useEffect(() => {
    if (!session) return;
    listWaterEntries(dateKey).then(setWaterEntries).catch(() => {});
  }, [session, dateKey]);

  const ironReminder = onPeriod;
  // L'objectif du jour inclut déjà l'activité loguée et l'ajustement lutéal :
  // « ce qui reste » évite de comparer deux chiffres de tête.
  const caloriesLeft = dailyTargets ? dailyTargets.calories_kcal - dayTotals.totals.calories_kcal : 0;
  const waterTotalMl = waterEntries.reduce((sum, w) => sum + w.amount_ml, 0);

  const [waterError, setWaterError] = useState<string | null>(null);

  const handleAddWater = async () => {
    setWaterError(null);
    try {
      const entry = await addWaterEntry(dateKey, WATER_GLASS_ML);
      setWaterEntries((prev) => [...prev, entry]);
    } catch (err) {
      setWaterError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };

  const handleRemoveLastWater = async () => {
    const last = waterEntries[waterEntries.length - 1];
    if (!last) return;
    setWaterError(null);
    try {
      await deleteWaterEntry(last.id);
      setWaterEntries((prev) => prev.filter((w) => w.id !== last.id));
    } catch (err) {
      setWaterError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };

  const handleBeverageTypeChange = (type: BeverageType) => {
    setBeverageType(type);
    if (!BEVERAGE_UNITS_BY_TYPE[type].includes(beverageUnit)) {
      setBeverageUnit(BEVERAGE_UNITS_BY_TYPE[type][0]);
    }
  };

  const handleAddBeverage = async () => {
    const qty = parseFloat(beverageQty.replace(',', '.'));
    if (Number.isNaN(qty) || qty <= 0) return;
    setWaterError(null);
    try {
      const ml = qty * (beverageUnit === 'litre' ? LITRE_ML : TASSE_ML);
      const entry = await addWaterEntry(dateKey, ml, beverageType);
      setWaterEntries((prev) => [...prev, entry]);
    } catch (err) {
      setWaterError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };

  const beverageBreakdown = BEVERAGE_TYPES.map((b) => ({
    ...b,
    ml: waterEntries.filter((w) => w.beverage_type === b.value).reduce((sum, w) => sum + w.amount_ml, 0),
  })).filter((b) => b.ml > 0);

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
          ← <span className="date-nav-word">Veille</span>
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
          <span className="date-nav-word">Lendemain</span> →
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

      {!profile && (
        <p className="hint">
          Renseigne ton <Link to="/settings">profil dans les Paramètres</Link> pour voir tes
          objectifs journaliers ici.
        </p>
      )}
      {targetsBlockedReason(profile) && (
        <p className="hint warning-hint">{targetsBlockedReason(profile)}</p>
      )}
      {dailyTargets?.flooredBySafety && (
        <p className="hint warning-hint">
          ⚠️ Ton objectif calculé était en dessous du plancher de sécurité — il a été ajusté au
          minimum recommandé. Si tu vises une perte de poids plus rapide, mieux vaut en parler à un
          professionnel de santé qu'ajuster ce chiffre.
        </p>
      )}
      {ironReminder && (
        <p className="hint warning-hint">
          🩸 Règles en cours — pense à surveiller ton apport en fer ces jours-ci (pertes de sang).{' '}
          <Link to="/cycle">Gérer le suivi du cycle</Link>
        </p>
      )}
      {lutealPhase && (
        <p className="hint warning-hint">
          🌙 Semaine avant les règles — besoin énergétique généralement un peu plus élevé (inclus
          dans ton objectif calorique aujourd'hui), et magnésium/oméga-3 souvent plus sollicités.{' '}
          <Link to="/cycle">Gérer le suivi du cycle</Link>
        </p>
      )}

      <div className="journal-blocks">
        {dailyTargets || bilan ? (
          <div className="block b-petrole block-calories">
            <h4 className="block-label">Calories</h4>
            {dailyTargets ? (
              <p className="block-number-line">
                <span className="block-number">
                  {caloriesLeft >= 0 ? Math.round(caloriesLeft) : `+${Math.round(-caloriesLeft)}`}
                </span>
                <span className="block-caption">
                  {caloriesLeft >= 0 ? 'kcal restantes' : "kcal au-dessus de l'objectif"}
                </span>
              </p>
            ) : (
              <p className="block-number-line">
                <span className="block-number">{Math.round(dayTotals.totals.calories_kcal)}</span>
                <span className="block-caption">kcal mangées</span>
              </p>
            )}
            {dailyTargets && (
              <>
                <div className="block-progress" aria-hidden="true">
                  <div
                    style={{
                      width: `${Math.min(100, (dayTotals.totals.calories_kcal / dailyTargets.calories_kcal) * 100)}%`,
                    }}
                  />
                </div>
                <p className="block-meta">
                  {Math.round(dayTotals.totals.calories_kcal)} mangées · objectif {Math.round(dailyTargets.calories_kcal)} kcal
                </p>
              </>
            )}
            {bilan && (
              <p className="block-meta">
                Dépensé {Math.round(bilan.expenses)} kcal · écart {bilan.gap >= 0 ? '+' : ''}
                {Math.round(bilan.gap)} kcal
              </p>
            )}
            {bilan && (
              <p className="hint bilan-line">
                Métabolisme de base {Math.round(bilan.bmr)} kcal
                {bilan.measured ? (
                  <>
                    {' '}
                    + <Link to="/activity">activité loguée</Link> {Math.round(bilan.activityCalories)} kcal
                  </>
                ) : (
                  <> × niveau d'activité du profil (estimation — logue une activité pour un bilan basé sur du réel)</>
                )}
              </p>
            )}
          </div>
        ) : null}

        <div className="block b-eau block-macros">
          <h4 className="block-label">Macros</h4>
          <div className="meter-group">
            <MacroMeter label="Protéines" actual={dayTotals.totals.protein_g} target={dailyTargets?.protein_g} unit="g" />
            <MacroMeter label="Glucides" actual={dayTotals.totals.carbs_g} target={dailyTargets?.carbs_g} unit="g" />
            <MacroMeter label="Lipides" actual={dayTotals.totals.fat_g} target={dailyTargets?.fat_g} unit="g" />
            <MacroMeter
              label="dont saturés"
              actual={dayTotals.totals.fat_saturated_g}
              target={dailyTargets?.fat_saturated_g}
              unit="g"
            />
          </div>
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
          {(dayTotals.hasPartial || dayTotals.hasWarning) && (
            <p className="hint warning-hint">
              Certaines lignes du détail des repas sont des estimations approximatives, ou affichent
              "?" quand aucune valeur n'a pu être calculée.
            </p>
          )}
        </div>

        {dayTotals.hasAny && (
          <div className="block b-blanc block-omegas">
            <h4 className="block-label">Oméga 3 · 6 · 9</h4>
            <div className="meter-group">
              <MacroMeter label="Oméga-3" actual={dayTotals.totals.omega3_g} target={dailyTargets?.omega3_g} unit="g" />
              <MacroMeter label="Oméga-6" actual={dayTotals.totals.omega6_g} target={dailyTargets?.omega6_g} unit="g" />
              <MacroMeter label="Oméga-9" actual={dayTotals.totals.omega9_g} target={dailyTargets?.omega9_g} unit="g" />
            </div>
            {dayTotals.totals.omega3_g > 0 && (
              <p className="omega-ratio">
                Rapport oméga-6 / oméga-3 :{' '}
                <strong>{(dayTotals.totals.omega6_g / dayTotals.totals.omega3_g).toLocaleString('fr-CH', { maximumFractionDigits: 1 })}</strong>{' '}
                <span className="hint">(repère : moins de {OMEGA6_OMEGA3_RATIO_MAX})</span>
              </p>
            )}
            <p className="hint">
              Repères ANSES adaptés à ton objectif calorique : oméga-3 = 1 % des calories + 0,5 g
              d'EPA/DHA (poissons gras) ; oméga-6 = 4 % ; oméga-9 = 15 à 20 %
              {dailyTargets ? ` (jusqu'à ${Math.round(dailyTargets.omega9_max_g)} g)` : ''}. Un « 0 » peut
              vouloir dire « non mesuré » : le détail des acides gras manque pour certains aliments.
            </p>
          </div>
        )}

        {(activityEntries.length > 0 || bilan) && (
          <div className="block b-corail block-activite">
            <h4 className="block-label">Activité</h4>
            {activityEntries.length > 0 && (
              <p className="block-number-line">
                <span className="block-number">
                  {Math.round(activityEntries.reduce((sum, a) => sum + a.calories_kcal, 0))}
                </span>
                <span className="block-caption">kcal brûlées</span>
              </p>
            )}
            {activityEntries.length > 0 ? (
              <ul className="activity-summary-list">
                {activityEntries.map((a) => (
                  <li key={a.id}>
                    <span>
                      {a.activity_type}
                      {a.training_type && ` · ${TRAINING_TYPES.find((t) => t.value === a.training_type)?.label}`}
                      {a.intensity && ` · ${INTENSITIES.find((i) => i.value === a.intensity)?.label}`}
                    </span>
                    <span className="hint">{a.duration_minutes} min · {Math.round(a.calories_kcal)} kcal</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="hint">
                Rien loguée aujourd'hui — <Link to="/activity">ajouter une activité</Link>.
              </p>
            )}
          </div>
        )}

        <div className="block b-blanc block-eau" id="hydratation">
          <h4 className="block-label">Hydratation</h4>
          {waterError && <p className="error">{waterError}</p>}
          <MacroMeter label="Total" actual={waterTotalMl} target={waterTarget(profile, dailyTargets)} unit="ml" />
          <p className="hint">
            {dailyTargets
              ? "Objectif basé sur ta dépense énergétique du jour (~1 mL/kcal) — dépend donc de ton âge, ta taille, ton sexe, ton poids et ton activité."
              : "Renseigne ton profil dans les Paramètres pour un objectif basé sur ta dépense énergétique plutôt que sur ton poids seul."}
          </p>
          {beverageBreakdown.length > 0 && (
            <p className="hint beverage-breakdown">
              {beverageBreakdown
                .map((b) => `${b.icon} ${Math.round(b.ml)} ml`)
                .join(' · ')}
            </p>
          )}
          <div className="water-actions">
            <button type="button" onClick={handleAddWater}>
              + un verre d'eau (250 ml)
            </button>
            {waterEntries.length > 0 && (
              <button type="button" className="link-button" onClick={handleRemoveLastWater}>
                Annuler le dernier
              </button>
            )}
          </div>
          <div className="beverage-add-row">
            <select value={beverageType} onChange={(e) => handleBeverageTypeChange(e.target.value as BeverageType)}>
              {BEVERAGE_TYPES.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.icon} {b.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="any"
              min="0"
              value={beverageQty}
              onChange={(e) => setBeverageQty(e.target.value)}
              className="ingredient-qty"
            />
            <select value={beverageUnit} onChange={(e) => setBeverageUnit(e.target.value as BeverageUnit)}>
              {BEVERAGE_UNITS_BY_TYPE[beverageType].map((u) => (
                <option key={u} value={u}>
                  {u === 'tasse' ? 'tasse(s)' : 'litre(s)'}
                </option>
              ))}
            </select>
            <button type="button" onClick={handleAddBeverage}>
              Ajouter
            </button>
          </div>
        </div>
        {onPeriod && (
          <div className="block b-blanc block-cycle">
            <h4 className="block-label">Cycle menstruel</h4>
            <div className="meter-group">
              <MacroMeter
                label="Fer"
                actual={dayTotals.totals.iron_mg}
                target={CYCLE_NUTRIENT_TARGETS.iron_mg}
                unit="mg"
              />
              <MacroMeter
                label="Vitamine C"
                actual={dayTotals.totals.vitamin_c_mg}
                target={CYCLE_NUTRIENT_TARGETS.vitamin_c_mg}
                unit="mg"
              />
              <MacroMeter
                label="Magnésium"
                actual={dayTotals.totals.magnesium_mg}
                target={CYCLE_NUTRIENT_TARGETS.magnesium_mg + (lutealPhase ? LUTEAL_MAGNESIUM_EXTRA_MG : 0)}
                unit="mg"
              />
              <MacroMeter
                label="Oméga-3"
                actual={dayTotals.totals.omega3_g}
                target={dailyTargets?.omega3_g ?? CYCLE_NUTRIENT_TARGETS.omega3_g}
                unit="g"
              />
            </div>
            <p className="hint">
              Repères généraux (femme adulte, ANSES/EFSA), pas une prescription individuelle. La
              vitamine C aide l'absorption du fer d'origine végétale — pratique de les manger
              ensemble. L'oméga-3 manque encore de données pour beaucoup d'ingrédients (peu
              renseigné dans la base USDA) — un "0 g" peut vouloir dire "non mesuré", pas "absent".
            </p>
          </div>
        )}
      </div>

      <div className="journal-summary">
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
