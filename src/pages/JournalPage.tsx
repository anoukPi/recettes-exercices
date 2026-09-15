import { Link, useSearchParams } from 'react-router-dom';
import { addDays, formatDateKeyFr, toDateKey } from '../lib/date';
import { useDayNutrition } from '../lib/useDayNutrition';
import { useSession } from '../lib/auth';
import type { NutritionTotals } from '../types';

const GI_BANDS: { max: number; label: string; className: string }[] = [
  { max: 35, label: 'très bas', className: 'gi-very-low' },
  { max: 55, label: 'bas', className: 'gi-low' },
  { max: 70, label: 'modéré', className: 'gi-moderate' },
  { max: Infinity, label: 'élevé', className: 'gi-high' },
];

function giAppreciation(avgGi: number): { label: string; className: string } {
  const band = GI_BANDS.find((b) => avgGi < b.max) ?? GI_BANDS[GI_BANDS.length - 1];
  return { label: band.label, className: band.className };
}

const MICRO_LABELS: { key: keyof NutritionTotals; label: string; unit: string }[] = [
  { key: 'fiber_g', label: 'Fibres', unit: 'g' },
  { key: 'sugar_g', label: 'Sucres', unit: 'g' },
  { key: 'sodium_mg', label: 'Sodium', unit: 'mg' },
  { key: 'calcium_mg', label: 'Calcium', unit: 'mg' },
  { key: 'iron_mg', label: 'Fer', unit: 'mg' },
  { key: 'potassium_mg', label: 'Potassium', unit: 'mg' },
  { key: 'magnesium_mg', label: 'Magnésium', unit: 'mg' },
  { key: 'zinc_mg', label: 'Zinc', unit: 'mg' },
  { key: 'vitamin_a_mcg', label: 'Vitamine A', unit: 'µg' },
  { key: 'vitamin_c_mg', label: 'Vitamine C', unit: 'mg' },
  { key: 'vitamin_d_mcg', label: 'Vitamine D', unit: 'µg' },
  { key: 'vitamin_e_mg', label: 'Vitamine E', unit: 'mg' },
  { key: 'vitamin_b12_mcg', label: 'Vitamine B12', unit: 'µg' },
];

export function JournalPage() {
  const { session, loading: authLoading } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const dateKey = searchParams.get('date') || toDateKey(new Date());
  const setDateKey = (next: string) => setSearchParams({ date: next });

  const { loading, error, profile, dailyTargets, dayTotals, dayGi, bilan } = useDayNutrition(dateKey);

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

      {loading && <p>Chargement…</p>}
      {error && <p className="error">{error}</p>}

      <div className="journal-summary">
        <div className="journal-summary-main">
          <div>
            <span className="journal-summary-value">{Math.round(dayTotals.totals.calories_kcal)}</span>
            <span className="journal-summary-unit">
              {dailyTargets ? `/ ${Math.round(dailyTargets.calories_kcal)} kcal` : 'kcal'}
            </span>
          </div>
          <div>
            <span className="journal-summary-value">{Math.round(dayTotals.totals.protein_g)}</span>
            <span className="journal-summary-unit">
              {dailyTargets ? `/ ${Math.round(dailyTargets.protein_g)} g protéines` : 'g protéines'}
            </span>
          </div>
          <div>
            <span className="journal-summary-value">{Math.round(dayTotals.totals.carbs_g)}</span>
            <span className="journal-summary-unit">
              {dailyTargets ? `/ ${Math.round(dailyTargets.carbs_g)} g glucides` : 'g glucides'}
            </span>
          </div>
          <div>
            <span className="journal-summary-value">{Math.round(dayTotals.totals.fat_g)}</span>
            <span className="journal-summary-unit">
              {dailyTargets ? `/ ${Math.round(dailyTargets.fat_g)} g lipides` : 'g lipides'}
            </span>
          </div>
          <div>
            <span className="journal-summary-value">{Math.round(dayTotals.totals.glycemic_load)}</span>
            <span className="journal-summary-unit">charge glycémique</span>
          </div>
        </div>
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
        {dayGi !== null && (
          <p className={`gi-appreciation ${giAppreciation(dayGi).className}`}>
            IG global du jour : {Math.round(dayGi)} ({giAppreciation(dayGi).label})
          </p>
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
            ⚠️ Estimation approximative : certaines lignes du détail des repas sont marquées ⚠️
            (survole l'icône pour savoir pourquoi) ou affichent "?" quand aucune valeur n'a pu être
            calculée.
          </p>
        )}
        {dayTotals.hasAny && (
          <details className="journal-micro-details">
            <summary>Micronutriments</summary>
            <ul className="journal-micro-list">
              {MICRO_LABELS.map(({ key, label, unit }) => (
                <li key={key}>
                  <span>{label}</span>
                  <span>
                    {Math.round(dayTotals.totals[key] * 10) / 10} {unit}
                  </span>
                </li>
              ))}
              <li>
                <span>Sel</span>
                <span>{Math.round(((dayTotals.totals.sodium_mg * 2.5) / 1000) * 10) / 10} g</span>
              </li>
            </ul>
          </details>
        )}
      </div>

      <Link className="button" to={`/repas?date=${dateKey}`}>
        Voir / modifier les repas de ce jour
      </Link>
    </section>
  );
}
