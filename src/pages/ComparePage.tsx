import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  listComparableFoods,
  matchesSearch,
  normalizeForSearch,
  searchUsda,
  translateToEnglish,
  valuesForFood,
  type ComparableFood,
  type FoodValues,
} from '../api/foodCompare';
import { baseNameForGi, categoryFor, FOOD_CATEGORIES, type FoodCategory } from '../lib/foodCategories';
import { giFor } from '../lib/glycemicIndex';
import type { NutritionPer100g } from '../types';

type SortKey =
  | 'calories_kcal'
  | 'protein_g'
  | 'protein_density'
  | 'carbs_g'
  | 'fat_g'
  | 'fiber_g'
  | 'sugar_g'
  | 'gi'
  | 'unsat_share'
  | 'omega3_g'
  | 'omega6_g'
  | 'omega9_g';

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'calories_kcal', label: 'kcal' },
  { key: 'protein_g', label: 'Prot.' },
  { key: 'carbs_g', label: 'Gluc.' },
  { key: 'fat_g', label: 'Lip.' },
  { key: 'fiber_g', label: 'Fibres' },
  { key: 'sugar_g', label: 'Sucres' },
  { key: 'gi', label: 'IG' },
  { key: 'protein_density', label: 'Prot./100 kcal' },
  { key: 'unsat_share', label: '% insat.' },
  { key: 'omega3_g', label: 'Ω-3' },
  { key: 'omega6_g', label: 'Ω-6' },
  { key: 'omega9_g', label: 'Ω-9' },
];

// Les questions qu'on se pose le plus souvent, en un tap.
const QUESTIONS: { label: string; key: SortKey; dir: 'asc' | 'desc' }[] = [
  { label: 'Le moins calorique', key: 'calories_kcal', dir: 'asc' },
  { label: 'Le plus protéiné', key: 'protein_g', dir: 'desc' },
  { label: 'Le plus de protéines par calorie', key: 'protein_density', dir: 'desc' },
  { label: 'Le moins de glucides', key: 'carbs_g', dir: 'asc' },
  { label: "L'IG le plus bas", key: 'gi', dir: 'asc' },
  { label: 'Le moins gras', key: 'fat_g', dir: 'asc' },
  { label: 'Le plus de fibres', key: 'fiber_g', dir: 'desc' },
  { label: 'Les meilleurs lipides', key: 'unsat_share', dir: 'desc' },
  { label: "Le plus d'oméga-3", key: 'omega3_g', dir: 'desc' },
  { label: 'Le moins sucré', key: 'sugar_g', dir: 'asc' },
];

// « Je cherche une source de… » : familles candidates, critère pour garder un
// aliment une fois ses valeurs connues, et classement par défaut (ce qui rend
// une source « intéressante » : beaucoup de protéines pour peu de calories ;
// des glucides à IG bas).
type Goal = 'proteines' | 'glucides' | 'fibres' | 'lipides';
const GOALS: Record<
  Goal,
  {
    label: string;
    categories: FoodCategory[];
    keep: (v: NutritionPer100g) => boolean;
    sort: SortKey;
    dir: 'asc' | 'desc';
    hint: string;
  }
> = {
  proteines: {
    label: 'Une source de protéines',
    categories: [
      'Viandes',
      'Poissons & fruits de mer',
      'Œufs & produits laitiers',
      'Légumineuses',
      'Alternatives végétales',
      'Oléagineux & graines',
      'Céréales & féculents',
      'Farines',
    ],
    keep: (v) => !!v.calories_kcal && (v.protein_g ?? 0) >= 5 && ((v.protein_g ?? 0) * 4) / v.calories_kcal >= 0.2,
    sort: 'protein_density',
    dir: 'desc',
    hint: 'Aliments dont au moins 20 % des calories viennent des protéines, classés par protéines pour 100 kcal.',
  },
  glucides: {
    label: 'Une source de glucides',
    // Féculents seulement : fruits et légumes à IG bas (cassis, échalote…)
    // passeraient devant sans être de vraies bases de repas.
    categories: ['Céréales & féculents', 'Farines', 'Légumineuses'],
    keep: (v) => !!v.calories_kcal && (v.carbs_g ?? 0) >= 10 && ((v.carbs_g ?? 0) * 4) / v.calories_kcal >= 0.4,
    sort: 'gi',
    dir: 'asc',
    hint: 'Céréales, féculents, farines et légumineuses dont au moins 40 % des calories viennent des glucides, classés par IG (le plus bas en premier). Regarde aussi les fibres.',
  },
  fibres: {
    label: 'Une source de fibres',
    categories: [
      'Légumineuses',
      'Céréales & féculents',
      'Farines',
      'Fruits',
      'Légumes',
      'Oléagineux & graines',
    ],
    // Seuil de l'allégation européenne « source de fibres » : 3 g / 100 g.
    keep: (v) => (v.fiber_g ?? 0) >= 3,
    sort: 'fiber_g',
    dir: 'desc',
    hint: 'Aliments avec au moins 3 g de fibres pour 100 g (seuil européen « source de fibres » ; « riche en fibres » dès 6 g), classés du plus riche au moins riche.',
  },
  lipides: {
    label: 'Une source de bons lipides',
    categories: [
      'Oléagineux & graines',
      'Matières grasses',
      'Poissons & fruits de mer',
      'Fruits',
      'Légumes',
      'Œufs & produits laitiers',
    ],
    // « Bons » lipides = majoritairement insaturés (mono + poly : huile d'olive,
    // avocat, noix, poissons gras…) ; exclut beurre, huile de coco, crème.
    keep: (v) => {
      const share = unsaturatedShare(v);
      return (v.fat_g ?? 0) >= 5 && share !== null && share >= 65;
    },
    sort: 'unsat_share',
    dir: 'desc',
    hint: "Aliments avec au moins 5 g de lipides pour 100 g, dont au moins 65 % d'acides gras insaturés (mono + poly), classés par part d'insaturés. Pour les oméga-3, pense aux poissons gras, noix, graines de lin et de chia.",
  },
};

const MAX_MATCHES = 40;
const MAX_LISTED = 250;
const PER_100G_ONLY: SortKey[] = ['gi', 'protein_density', 'unsat_share'];

type RowState = FoodValues | null | 'loading' | 'error';

interface Row {
  food: ComparableFood;
  state: RowState;
  gi: number | null;
}

function giForFood(food: ComparableFood): number | null {
  if (food.key.startsWith('usda:')) return null;
  return giFor(food.name) ?? giFor(baseNameForGi(food.name));
}

/** Part des lipides qui sont insaturés (mono + poly), en %. null si le détail
 * des acides gras manque (valeurs de référence saisies à la main, par ex.). */
function unsaturatedShare(v: NutritionPer100g): number | null {
  if (!v.fat_g || v.fat_monounsaturated_g === null || v.fat_polyunsaturated_g === null) return null;
  return Math.min(100, ((v.fat_monounsaturated_g + v.fat_polyunsaturated_g) / v.fat_g) * 100);
}

/** Valeur pour 100 g ; la densité protéique (g de protéines pour 100 kcal),
 * l'IG et la part d'insaturés ne dépendent pas de la quantité. */
function metric(values: NutritionPer100g, key: SortKey, gi: number | null): number | null {
  if (key === 'gi') return gi;
  if (key === 'unsat_share') return unsaturatedShare(values);
  if (key === 'protein_density') {
    if (!values.calories_kcal || values.protein_g === null) return null;
    return (values.protein_g / values.calories_kcal) * 100;
  }
  return values[key];
}

function formatValue(value: number | null, key: SortKey): string {
  if (value === null) return '—';
  if (key === 'calories_kcal' || key === 'gi') return String(Math.round(value));
  if (key === 'unsat_share') return `${Math.round(value)} %`;
  return (Math.round(value * 10) / 10).toLocaleString('fr-CH');
}

export function ComparePage() {
  const [foods, setFoods] = useState<ComparableFood[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<FoodCategory | ''>('');
  const [goal, setGoal] = useState<Goal | null>(null);
  const [grams, setGrams] = useState('100');
  const [sortKey, setSortKey] = useState<SortKey>('calories_kcal');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [states, setStates] = useState<Record<string, RowState>>({});
  const [pinned, setPinned] = useState<ComparableFood[]>([]);

  const [frenchQuery, setFrenchQuery] = useState('');
  const [translating, setTranslating] = useState(false);
  const [translationNote, setTranslationNote] = useState<string | null>(null);
  const [usdaQuery, setUsdaQuery] = useState('');
  const [usdaResults, setUsdaResults] = useState<Awaited<ReturnType<typeof searchUsda>> | null>(null);
  const [usdaLoading, setUsdaLoading] = useState(false);
  const [usdaError, setUsdaError] = useState<string | null>(null);

  useEffect(() => {
    listComparableFoods()
      .then(setFoods)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Erreur de chargement.'));
  }, []);

  const categoryByKey = useMemo(() => new Map(foods.map((f) => [f.key, categoryFor(f.name)])), [foods]);

  const candidates = useMemo(() => {
    const q = normalizeForSearch(query);
    const hasQuery = q.length >= 2;
    if (!hasQuery && !category && !goal) return [];
    const allowed = goal ? new Set<FoodCategory>(GOALS[goal].categories) : null;
    const list = foods.filter((f) => {
      const c = categoryByKey.get(f.key) ?? null;
      if (category && c !== category) return false;
      if (allowed && (!c || !allowed.has(c))) return false;
      if (hasQuery && !matchesSearch(f.name, q)) return false;
      return true;
    });
    return list.slice(0, hasQuery && !category && !goal ? MAX_MATCHES : MAX_LISTED);
  }, [foods, categoryByKey, query, category, goal]);

  const visibleFoods = useMemo(() => {
    const seen = new Set<string>();
    const list: ComparableFood[] = [];
    for (const f of [...pinned, ...candidates]) {
      if (!seen.has(f.key)) {
        seen.add(f.key);
        list.push(f);
      }
    }
    return list;
  }, [pinned, candidates]);

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
  const pinnedKeys = useMemo(() => new Set(pinned.map((f) => f.key)), [pinned]);

  const { rows, pendingCount } = useMemo(() => {
    let pending = 0;
    const list: Row[] = [];
    for (const food of visibleFoods) {
      // null = aucune donnée pour cet aliment (≠ pas encore chargé).
      const state: RowState = food.key in states ? states[food.key] : 'loading';
      if (goal && !pinnedKeys.has(food.key)) {
        // En mode « source de… », seuls les aliments qui passent le critère
        // s'affichent ; ceux encore en chargement sont comptés à part.
        if (state === 'loading') {
          pending++;
          continue;
        }
        if (!state || state === 'error' || !GOALS[goal].keep(state.values)) continue;
      }
      list.push({ food, state, gi: giForFood(food) });
    }
    // Alias d'un même aliment (« graine » / « graines de chanvre », « poudre
    // amande » / « poudre d'amande ») : mêmes valeurs, une seule ligne — on
    // garde le nom de la liste d'ingrédients, sinon le plus court.
    const byValues = new Map<string, Row>();
    const deduped: Row[] = [];
    for (const row of list) {
      if (!row.state || typeof row.state !== 'object' || pinnedKeys.has(row.food.key)) {
        deduped.push(row);
        continue;
      }
      const v = row.state.values;
      const sig = [row.state.sourceLabel, v.calories_kcal, v.protein_g, v.carbs_g, v.fat_g, v.fiber_g].join('|');
      const kept = byValues.get(sig);
      if (!kept) {
        byValues.set(sig, row);
        deduped.push(row);
        continue;
      }
      const better =
        (row.food.referenceItemId && !kept.food.referenceItemId) ||
        (!!row.food.referenceItemId === !!kept.food.referenceItemId && row.food.name.length < kept.food.name.length);
      if (better) {
        deduped[deduped.indexOf(kept)] = row;
        byValues.set(sig, row);
      }
    }
    list.length = 0;
    list.push(...deduped);
    const valueOf = (r: Row) => (r.state && typeof r.state === 'object' ? metric(r.state.values, sortKey, r.gi) : null);
    list.sort((a, b) => {
      const va = valueOf(a);
      const vb = valueOf(b);
      if (va === null && vb === null) return a.food.name.localeCompare(b.food.name, 'fr');
      if (va === null) return 1;
      if (vb === null) return -1;
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return { rows: list, pendingCount: pending };
  }, [visibleFoods, states, sortKey, sortDir, goal, pinnedKeys]);

  const bestKey = rows.find(
    (r) => r.state && typeof r.state === 'object' && metric(r.state.values, sortKey, r.gi) !== null,
  )?.food.key;

  const chooseSort = (key: SortKey, dir?: 'asc' | 'desc') => {
    if (dir) {
      setSortKey(key);
      setSortDir(dir);
    } else if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(['calories_kcal', 'fat_g', 'sugar_g', 'carbs_g', 'gi'].includes(key) ? 'asc' : 'desc');
    }
  };

  const chooseGoal = (g: Goal) => {
    if (goal === g) {
      setGoal(null);
      return;
    }
    setGoal(g);
    chooseSort(GOALS[g].sort, GOALS[g].dir);
  };

  const togglePin = (food: ComparableFood) => {
    setPinned((prev) =>
      prev.some((f) => f.key === food.key) ? prev.filter((f) => f.key !== food.key) : [...prev, food],
    );
  };

  const runUsdaSearch = async (english: string) => {
    if (!english.trim()) return;
    setUsdaLoading(true);
    setUsdaError(null);
    try {
      setUsdaResults(await searchUsda(english.trim()));
    } catch (err) {
      setUsdaError(err instanceof Error ? err.message : 'La recherche a échoué.');
    } finally {
      setUsdaLoading(false);
    }
  };

  const handleTranslate = async (e: FormEvent) => {
    e.preventDefault();
    if (!frenchQuery.trim()) return;
    setTranslating(true);
    setUsdaError(null);
    setTranslationNote(null);
    try {
      const { text, source } = await translateToEnglish(frenchQuery);
      setUsdaQuery(text);
      setTranslationNote(
        source === 'kaly'
          ? `Traduction du dictionnaire Kaly : « ${text} ».`
          : `Traduction automatique : « ${text} » — vérifie-la, corrige-la au besoin puis relance la recherche.`,
      );
      await runUsdaSearch(text);
    } catch (err) {
      setUsdaError(err instanceof Error ? err.message : 'La traduction a échoué.');
    } finally {
      setTranslating(false);
    }
  };

  const handleUsdaSearch = (e: FormEvent) => {
    e.preventDefault();
    void runUsdaSearch(usdaQuery);
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
        Choisis ce que tu cherches, une famille ou un nom, puis ta question. Valeurs pour l'aliment
        cru ou sec, sauf mention « cuit » ou « en conserve ». Touche ☆ pour garder un aliment dans la
        comparaison quand tu changes de recherche.
      </p>
      {loadError && <p className="error">{loadError}</p>}

      <div className="compare-goals">
        <span className="compare-label">Je cherche</span>
        <div className="tag-filter">
          {(Object.keys(GOALS) as Goal[]).map((g) => (
            <button
              key={g}
              type="button"
              className={`tag-chip${goal === g ? ' selected' : ''}`}
              onClick={() => chooseGoal(g)}
            >
              {GOALS[g].label}
            </button>
          ))}
        </div>
      </div>
      {goal && <p className="hint">{GOALS[goal].hint}</p>}

      <div className="compare-controls">
        <div className="field">
          <label htmlFor="compare-category">Famille</label>
          <select
            id="compare-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as FoodCategory | '')}
          >
            <option value="">Toutes</option>
            {FOOD_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="compare-search">Nom</label>
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

      {query.trim().length >= 2 && candidates.length === 0 && (
        <p className="hint">
          Aucun aliment connu ne correspond. Essaie un autre mot, une autre famille, ou teste-le
          directement dans la base USDA ci-dessous.
        </p>
      )}
      {pendingCount > 0 && (
        <p className="hint">
          Calcul en cours pour {pendingCount} aliment{pendingCount > 1 ? 's' : ''}…
        </p>
      )}
      {sortKey === 'gi' && rows.length > 0 && (
        <p className="hint">IG du guide de référence : les aliments sans IG connu sont classés à la fin.</p>
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
              {rows.map(({ food, state, gi }) => (
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
                      const raw = metric(state.values, c.key, gi);
                      const shown = raw === null || PER_100G_ONLY.includes(c.key) ? raw : raw * factor;
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
      {goal && rows.length === 0 && pendingCount === 0 && candidates.length > 0 && (
        <p className="hint">Aucun aliment de cette sélection ne correspond au critère.</p>
      )}

      <div className="compare-usda">
        <h3>Tester un aliment dans la base USDA</h3>
        <p className="hint">
          Pour un aliment que Kaly ne connaît pas encore. La base USDA est en anglais : écris le nom en
          français et traduis-le, ou tape directement le nom anglais. Choisis ensuite la bonne fiche
          et ajoute-la à la comparaison.
        </p>
        <form className="compare-controls" onSubmit={handleTranslate}>
          <div className="field">
            <label htmlFor="compare-french">Nom en français</label>
            <input
              id="compare-french"
              type="search"
              value={frenchQuery}
              onChange={(e) => setFrenchQuery(e.target.value)}
              placeholder="ex. farine d'épeautre"
              autoComplete="off"
            />
          </div>
          <button type="submit" disabled={translating || !frenchQuery.trim()}>
            {translating ? 'Traduction…' : 'Traduire et chercher'}
          </button>
        </form>
        {translationNote && <p className="hint">{translationNote}</p>}
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
