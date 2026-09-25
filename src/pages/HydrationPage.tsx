import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageIntro } from '../components/PageIntro';
import { addDays, formatDateKeyFr, toDateKey } from '../lib/date';
import { useSession } from '../lib/auth';
import { useDayNutrition } from '../lib/useDayNutrition';
import { addWaterEntry, deleteWaterEntry, listWaterEntries } from '../api/water';
import { BEVERAGE_UNITS_BY_TYPE, childAge, LITRE_ML, TASSE_ML, waterTarget, type BeverageUnit } from '../lib/hydration';
import { BEVERAGE_TYPES, type BeverageType, type WaterEntry } from '../types';

// Raccourcis : un geste pour les quantités les plus courantes.
const QUICK_ADDS = [
  { label: '💧 Verre', ml: 250, type: 'eau' as BeverageType },
  { label: '💧 Gourde', ml: 500, type: 'eau' as BeverageType },
  { label: '☕ Café', ml: TASSE_ML, type: 'café' as BeverageType },
  { label: '🍵 Thé', ml: TASSE_ML, type: 'thé' as BeverageType },
  { label: '🌿 Tisane', ml: TASSE_ML, type: 'tisane' as BeverageType },
];

export function HydrationPage() {
  const { session, loading: authLoading } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const dateKey = searchParams.get('date') || toDateKey(new Date());
  const setDateKey = (next: string) => setSearchParams({ date: next });

  const { profile, dailyTargets } = useDayNutrition(dateKey);
  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [beverageType, setBeverageType] = useState<BeverageType>('eau');
  const [beverageQty, setBeverageQty] = useState('1');
  const [beverageUnit, setBeverageUnit] = useState<BeverageUnit>('tasse');

  useEffect(() => {
    if (!session) return;
    listWaterEntries(dateKey)
      .then(setEntries)
      .catch(() => {});
  }, [session, dateKey]);

  const add = async (ml: number, type: BeverageType) => {
    setError(null);
    try {
      const entry = await addWaterEntry(dateKey, ml, type);
      setEntries((prev) => [...prev, entry]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };

  const remove = async (id: string) => {
    setError(null);
    try {
      await deleteWaterEntry(id);
      setEntries((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };

  const handleTypeChange = (type: BeverageType) => {
    setBeverageType(type);
    if (!BEVERAGE_UNITS_BY_TYPE[type].includes(beverageUnit)) setBeverageUnit(BEVERAGE_UNITS_BY_TYPE[type][0]);
  };

  const handleAddCustom = () => {
    const qty = parseFloat(beverageQty.replace(',', '.'));
    if (Number.isNaN(qty) || qty <= 0) {
      setError('Indique une quantité valide.');
      return;
    }
    add(qty * (beverageUnit === 'litre' ? LITRE_ML : TASSE_ML), beverageType);
  };

  if (authLoading) return null;
  if (!session) return null;

  const total = entries.reduce((sum, w) => sum + w.amount_ml, 0);
  const target = waterTarget(profile, dailyTargets);
  const pct = target > 0 ? Math.min(100, (total / target) * 100) : 0;
  const child = childAge(profile) !== null;
  const iconOf = (type: BeverageType) => BEVERAGE_TYPES.find((b) => b.value === type)?.icon ?? '💧';

  return (
    <section className="journal hydration-page">
      <PageIntro id="hydratation" emoji="💧" title="Ton hydratation">
        <p>
          Note ce que tu bois dans la journée : eau, thé, café, tisane. Un geste avec les raccourcis, ou une quantité
          précise en tasses ou en litres.{' '}
          {child
            ? 'Pour un enfant, le repère dépend de son âge.'
            : 'Ton repère suit ta dépense du jour (~1 ml par kcal).'}
        </p>
      </PageIntro>

      <div className="journal-date-nav">
        <button type="button" onClick={() => setDateKey(addDays(dateKey, -1))} aria-label="Jour précédent">
          ←
        </button>
        <strong>{formatDateKeyFr(dateKey)}</strong>
        <button type="button" onClick={() => setDateKey(addDays(dateKey, 1))} aria-label="Jour suivant">
          →
        </button>
      </div>

      <div className="block b-eau hydration-total">
        <p className="block-number-line">
          <span className="block-number">{(total / 1000).toLocaleString('fr-CH', { maximumFractionDigits: 2 })}</span>
          <span className="block-caption">
            L bus sur ≈ {(target / 1000).toLocaleString('fr-CH', { maximumFractionDigits: 1 })} L
          </span>
        </p>
        <div className="block-progress" aria-hidden="true">
          <div style={{ width: `${pct}%` }} />
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <h3>Ajouter</h3>
      <div className="hydration-quick">
        {QUICK_ADDS.map((q) => (
          <button key={q.label} type="button" className="tag-chip" onClick={() => add(q.ml, q.type)}>
            {q.label}
            <small> {q.ml} ml</small>
          </button>
        ))}
      </div>
      <div className="beverage-add-row">
        <select value={beverageType} onChange={(e) => handleTypeChange(e.target.value as BeverageType)}>
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
          aria-label="Quantité"
        />
        <select value={beverageUnit} onChange={(e) => setBeverageUnit(e.target.value as BeverageUnit)}>
          {BEVERAGE_UNITS_BY_TYPE[beverageType].map((u) => (
            <option key={u} value={u}>
              {u === 'tasse' ? 'tasse(s)' : 'litre(s)'}
            </option>
          ))}
        </select>
        <button type="button" onClick={handleAddCustom}>
          Ajouter
        </button>
      </div>

      <h3>Aujourd’hui</h3>
      {entries.length === 0 ? (
        <p className="empty">Rien noté pour ce jour.</p>
      ) : (
        <ul className="journal-entry-list">
          {entries.map((w) => (
            <li key={w.id} className="journal-entry">
              <div className="journal-entry-row">
                <span className="journal-entry-label">
                  {iconOf(w.beverage_type)} {BEVERAGE_TYPES.find((b) => b.value === w.beverage_type)?.label}
                </span>
                <span className="journal-entry-kcal">{Math.round(w.amount_ml)} ml</span>
                <button
                  type="button"
                  className="remove-row"
                  onClick={() => remove(w.id)}
                  aria-label={`Supprimer ${Math.round(w.amount_ml)} ml`}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="hint">
        <Link to={`/journal?date=${dateKey}`}>← Retour au carnet du jour</Link>
      </p>
    </section>
  );
}
