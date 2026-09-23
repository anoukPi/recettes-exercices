import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  listComparableFoods,
  matchesSearch,
  normalizeForSearch,
  searchUsda,
  valuesForFood,
  type ComparableFood,
  type FoodValues,
} from '../api/foodCompare';
import type { NutritionPer100g } from '../types';

type SortKey = 'calories_kcal' | 'protein_g' | 'protein_density' | 'carbs_g' | 'fat_g' | 'fiber_g' | 'sugar_g';

interface Column {
  key: SortKey;
  label: string;
  unit: string;
}

const COLUMNS: Column[] = [
  { key: 'calories_kcal', label: 'kcal', unit: '' },
  { key: 'protein_g', label: 'Prot.', unit: 'g' },
  { key: 'carbs_g', label: 'Gluc.', unit: 'g' },
  { key: 'fat_g', label: 'Lip.', unit: 'g' },
  { key: 'fiber_g', label: 'Fibres', unit: 'g' },
  { key: 'sugar_g', label: 'Sucres', unit: 'g' },
  { key: 'protein_density', label: 'Prot./100 kcal', unit: 'g' },
];

// Les questions qu'on se pose le plus souvent, en un tap.
const QUESTIONS: { label: string; key: SortKey; dir: 'asc' | 'desc' }[] = [
  { label: 'Le moins calorique', key: 'calories_kcal', dir: 'asc' },
  { label: 'Le plus protéiné', key: 'protein_g', dir: 'desc' },
  { label: 'Le plus de protéines par calorie', key: 'protein_density', dir: 'desc' },
  { label: 'Le moins de glucides', key: 'carbs_g', dir: 'asc' },
  { label: 'Le moins gras', key: 'fat_g', dir: 'asc' },
  { label: 'Le plus de fibres', key: 'fiber_g', dir: 'desc' },
  { label: 'Le moins sucré', key: 'sugar_g', dir: 'asc' },
];

const MAX_MATCHES = 40;

interface Row {
  food: ComparableFood;
  state: FoodValues | null | 'loading' | 'error';
}

/** Valeur pour 100 g ; la densité protéique (g de protéines pour 100 kcal) ne
 * dépend pas de la quantité. */
function metric(values: NutritionPer100g, key: SortKey): number | null {
  if (key === 'protein_density') {
    if (!values.calories_kcal || values.protein_g === null) return null;
    return (values.protein_g / values.calories_kcal) * 100;
  }
  return values[key];
}

function formatValue(value: number | null, key: SortKey): string {
  if (value === null) return '—';
  if (key === 'calories_kcal') return String(Math.round(value));
  return (Math.round(value * 10) / 10).toLocaleString('fr-CH');
}

export function ComparePage() {
  const [foods, setFoods] = useState<ComparableFood[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [grams, setGrams] = useState('100');
  const [sortKey, setSortKey] = useState<SortKey>('calories_kcal');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [states, setStates] = useState<Record<string, Row['state']>>({});
  const [pinned, setPinned] = useState<ComparableFood[]>([]);

  const [usdaQuery, setUsdaQuery] = useState('');
  const [usdaResults, setUsdaResults] = useState<Awaited<ReturnType<typeof searchUsda>> | null>(null);
  const [usdaLoading, setUsdaLoading] = useState(false);
  const [usdaError, setUsdaError] = useState<string | null>(null);

  useEffect(() => {
    listComparableFoods()
      .then(setFoods)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Erreur de chargement.'));
  }, []);

  const matches = useMemo(() => {
    const q = normalizeForSearch(query);
    if (q.length < 2) return [];
    return foods.filter((f) => matchesSearch(f.name, q)).slice(0, MAX_MATCHES);
  }, [foods, query]);

  const visibleFoods = useMemo(() => {
    const seen = new Set<string>();
    const list: ComparableFood[] = [];
    for (const f of [...pinned, ...matches]) {
      if (!seen.has(f.key)) {
        seen.add(f.key);
        list.push(f);
      }
    }
    return list;
  }, [pinned, matches]);

  // Charge les valeurs des aliments affichés qui ne le sont pas encore (tant
  // qu'une valeur manque, la ligne s'affiche « Chargement… »).
  const requested = useRef(new Set<string>());
  useEffect(() => {
    for (const f of visibleFoods) {
      if (requested.current.has(f.key)) continue;
      requested.current.add(f.key);
      valuesForFood(f)
        .then((v) => setStates((prev) => ({ ...prev, [f.key]: v })))
        .catch(() => {
          requested.current.delete(f.key);
          setStates((prev) => ({ ...prev, [f.key]: 'error' }));
        });
    }
  }, [visibleFoods]);

  const factor = (parseFloat(grams.replace(',', '.')) || 100) / 100;
  const pinnedKeys = new Set(pinned.map((f) => f.key));

  const rows: Row[] = useMemo(() => {
    // null = aucune donnée pour cet aliment (≠ pas encore chargé).
    const withState = visibleFoods.map((food) => ({
      food,
      state: food.key in states ? states[food.key] : ('loading' as const),
    }));
    const valueOf = (r: Row) =>
      r.state && typeof r.state === 'object' ? metric(r.state.values, sortKey) : null;
    return withState.sort((a, b) => {
      const va = valueOf(a);
      const vb = valueOf(b);
      if (va === null && vb === null) return a.food.name.localeCompare(b.food.name, 'fr');
      if (va === null) return 1;
      if (vb === null) return -1;
      return sortDir === 'asc' ? va - vb : vb - va;
    });
  }, [visibleFoods, states, sortKey, sortDir]);

  const bestKey = rows.find((r) => r.state && typeof r.state === 'object' && metric(r.state.values, sortKey) !== null)
    ?.food.key;

  const chooseSort = (key: SortKey, dir?: 'asc' | 'desc') => {
    if (dir) {
      setSortKey(key);
      setSortDir(dir);
    } else if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'calories_kcal' || key === 'fat_g' || key === 'sugar_g' || key === 'carbs_g' ? 'asc' : 'desc');
    }
  };

  const togglePin = (food: ComparableFood) => {
    setPinned((prev) => (prev.some((f) => f.key === food.key) ? prev.filter((f) => f.key !== food.key) : [...prev, food]));
  };

  const handleUsdaSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!usdaQuery.trim()) return;
    setUsdaLoading(true);
    setUsdaError(null);
    try {
      setUsdaResults(await searchUsda(usdaQuery.trim()));
    } catch (err) {
      setUsdaError(err instanceof Error ? err.message : 'La recherche a échoué.');
    } finally {
      setUsdaLoading(false);
    }
  };

  const addUsdaFood = (r: NonNullable<typeof usdaResults>[number]) => {
    const food: ComparableFood = { key: `usda:${r.fdcId}`, name: `USDA · ${r.description}`, referenceItemId: null };
    requested.current.add(food.key);
    setStates((prev) => ({ ...prev, [food.key]: { values: r.values, sourceLabel: r.description } }));
    setPinned((prev) => (prev.some((f) => f.key === food.key) ? prev : [...prev, food]));
  };

  const activeQuestion = QUESTIONS.find((q) => q.key === sortKey && q.dir === sortDir);

  return (
    <section className="compare-page">
      <h2>Comparer des aliments</h2>
      <p className="hint">
        Cherche une famille d'aliments (farine, fromage, riz…) puis choisis ta question. Valeurs pour
        l'aliment cru ou sec, sauf mention « cuit » ou « en conserve ». Touche ☆ pour garder un
        aliment dans la comparaison quand tu changes de recherche.
      </p>
      {loadError && <p className="error">{loadError}</p>}

      <div className="compare-controls">
        <div className="field">
          <label htmlFor="compare-search">Aliment</label>
          <input
            id="compare-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ex. farine"
            autoComplete="off"
          />
        </div>
        <div className="field compare-grams">
          <label htmlFor="compare-grams">Pour (g)</label>
          <input
            id="compare-grams"
            type="number"
            inputMode="decimal"
            min="1"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
          />
        </div>
      </div>

      <div className="tag-filter compare-questions">
        {QUESTIONS.map((q) => (
          <button
            key={q.label}
            type="button"
            className={`tag-chip${activeQuestion === q ? ' selected' : ''}`}
            onClick={() => chooseSort(q.key, q.dir)}
          >
            {q.label}
          </button>
        ))}
      </div>

      {query.trim().length >= 2 && matches.length === 0 && (
        <p className="hint">
          Aucun aliment connu ne contient « {query.trim()} ». Essaie un autre mot, ou teste-le
          directement dans la base USDA ci-dessous.
        </p>
      )}
      {matches.length === MAX_MATCHES && (
        <p className="hint">Seuls les {MAX_MATCHES} premiers résultats sont affichés — précise ta recherche.</p>
      )}

      {rows.length > 0 && (
        <div className="compare-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th scope="col" className="compare-name-col">
                  Aliment
                </th>
                {COLUMNS.map((c) => (
                  <th key={c.key} scope="col">
                    <button
                      type="button"
                      className={`compare-sort${sortKey === c.key ? ' active' : ''}`}
                      onClick={() => chooseSort(c.key)}
                    >
                      {c.label}
                      {sortKey === c.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ food, state }) => (
                <tr key={food.key} className={food.key === bestKey ? 'compare-best' : undefined}>
                  <th scope="row" className="compare-name-col">
                    <button
                      type="button"
                      className="compare-pin"
                      onClick={() => togglePin(food)}
                      aria-label={pinnedKeys.has(food.key) ? `Retirer ${food.name}` : `Garder ${food.name}`}
                    >
                      {pinnedKeys.has(food.key) ? '★' : '☆'}
                    </button>
                    <span title={state && typeof state === 'object' ? (state.sourceLabel ?? undefined) : undefined}>
                      {food.key === bestKey && '🏆 '}
                      {food.name}
                    </span>
                  </th>
                  {state === 'loading' && (
                    <td colSpan={COLUMNS.length} className="compare-status">
                      Chargement…
                    </td>
                  )}
                  {(state === null || state === 'error') && (
                    <td colSpan={COLUMNS.length} className="compare-status">
                      {state === 'error' ? 'Erreur — réessaie plus tard' : 'Pas de données'}
                    </td>
                  )}
                  {state &&
                    typeof state === 'object' &&
                    COLUMNS.map((c) => {
                      const raw = metric(state.values, c.key);
                      const shown = raw === null ? null : c.key === 'protein_density' ? raw : raw * factor;
                      return (
                        <td key={c.key} className={sortKey === c.key ? 'active' : undefined}>
                          {formatValue(shown, c.key)}
                        </td>
                      );
                    })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="compare-usda">
        <h3>Tester un aliment dans la base USDA</h3>
        <p className="hint">
          Pour un aliment que Kaly ne connaît pas encore. La base USDA est en anglais (ex. « spelt
          flour », « cottage cheese ») : choisis la bonne fiche et ajoute-la à la comparaison.
        </p>
        <form className="compare-controls" onSubmit={handleUsdaSearch}>
          <div className="field">
            <label htmlFor="compare-usda">Nom en anglais</label>
            <input
              id="compare-usda"
              type="search"
              value={usdaQuery}
              onChange={(e) => setUsdaQuery(e.target.value)}
              placeholder="ex. spelt flour"
              autoComplete="off"
            />
          </div>
          <button type="submit" disabled={usdaLoading || !usdaQuery.trim()}>
            {usdaLoading ? 'Recherche…' : 'Chercher'}
          </button>
        </form>
        {usdaError && <p className="error">{usdaError}</p>}
        {usdaResults && usdaResults.length === 0 && <p className="hint">Aucun résultat.</p>}
        {usdaResults && usdaResults.length > 0 && (
          <ul className="compare-usda-results">
            {usdaResults.map((r) => (
              <li key={r.fdcId}>
                <div>
                  <span>{r.description}</span>
                  <span className="meta">
                    {Math.round(r.values.calories_kcal ?? 0)} kcal · P {formatValue(r.values.protein_g, 'protein_g')} ·
                    G {formatValue(r.values.carbs_g, 'carbs_g')} · L {formatValue(r.values.fat_g, 'fat_g')} (100 g)
                  </span>
                </div>
                <button
                  type="button"
                  className="tag-chip"
                  onClick={() => addUsdaFood(r)}
                  disabled={pinnedKeys.has(`usda:${r.fdcId}`)}
                >
                  {pinnedKeys.has(`usda:${r.fdcId}`) ? 'Ajouté ✓' : '+ Comparer'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
