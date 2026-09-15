import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { SearchableSelect } from '../components/SearchableSelect';
import { addDays, defaultMealForNow, formatDateKeyFr, toDateKey } from '../lib/date';
import { addTotals, emptyTotals, scaleNutrition } from '../lib/nutritionCalc';
import { gramsForQuantity, isApproxUnit } from '../lib/unitConversion';
import { hasKnownTranslation } from '../lib/ingredientTranslations';
import { giFor } from '../lib/glycemicIndex';
import { addJournalEntry, deleteJournalEntry, listJournalEntries } from '../api/journal';
import { getIngredientNutrition } from '../api/nutrition';
import { addReferenceItem, listReferenceItems, type ReferenceItem } from '../api/referenceItems';
import { getRecipe, listRecipes } from '../api/recipes';
import { getProfile } from '../api/profile';
import { computeDailyTargets, type DailyTargets } from '../lib/dailyNeeds';
import { MEALS, type JournalEntry, type NutritionTotals, type Profile, type Recipe } from '../types';

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

const REASON_APPROX_UNIT = 'mesure convertie par une moyenne approximative (ex: 1 càs ≈ 15g), pas la densité réelle de cet ingrédient';
const REASON_UNKNOWN_TRANSLATION = "ingrédient sans traduction connue — la recherche dans la base USDA s'est faite avec le nom français tel quel, résultat non garanti";
const REASON_PARTIAL_RECIPE = "certains ingrédients de la recette n'ont pas pu être calculés (mesure non convertible ou ingrédient introuvable) et sont exclus du total";
const REASON_UNAVAILABLE = 'mesure non convertible en grammes, ou ingrédient introuvable dans la base USDA — aucune valeur calculable';
const REASON_UNKNOWN_GI = "indice glycémique inconnu pour cet ingrédient — non compté dans la charge glycémique du jour";

type EntryNutritionState =
  | { status: 'loading' }
  | {
      status: 'ok';
      totals: NutritionTotals;
      partial: boolean;
      warnings: string[];
      grams: number | null;
      gi: number | null;
    }
  | { status: 'unavailable' };

export function JournalPage() {
  const [dateKey, setDateKey] = useState(toDateKey(new Date()));
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [ingredientItems, setIngredientItems] = useState<ReferenceItem[]>([]);
  const [unitOptions, setUnitOptions] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [ingName, setIngName] = useState('');
  const [ingQty, setIngQty] = useState('');
  const [ingUnit, setIngUnit] = useState('');
  const [ingError, setIngError] = useState<string | null>(null);

  const [selectedMeal, setSelectedMeal] = useState<string>(defaultMealForNow());

  const [nutritionByEntry, setNutritionByEntry] = useState<Record<string, EntryNutritionState>>({});

  const loadEntries = (date: string) => {
    setLoading(true);
    listJournalEntries(date)
      .then(setEntries)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEntries(dateKey);
  }, [dateKey]);

  useEffect(() => {
    listReferenceItems('ingredient').then(setIngredientItems).catch(() => {});
    listReferenceItems('unit')
      .then((items) => setUnitOptions(items.map((i) => i.name)))
      .catch(() => {});
    listRecipes().then(setRecipes).catch(() => {});
    getProfile().then(setProfile).catch(() => {});
  }, []);

  const ingredientNameToId = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of ingredientItems) map.set(item.name.toLowerCase(), item.id);
    return map;
  }, [ingredientItems]);

  const recipeByTitle = useMemo(() => {
    const map = new Map<string, Recipe>();
    for (const r of recipes) map.set(r.title.toLowerCase(), r);
    return map;
  }, [recipes]);

  useEffect(() => {
    let cancelled = false;

    entries.forEach((entry) => {
      setNutritionByEntry((prev) => ({ ...prev, [entry.id]: { status: 'loading' } }));

      const compute = async () => {
        if (entry.kind === 'ingredient') {
          if (!entry.reference_item_id || !entry.unit) return { status: 'unavailable' as const };
          const grams = gramsForQuantity(entry.quantity, entry.unit, entry.label);
          if (grams === null) return { status: 'unavailable' as const };
          const nutrition = await getIngredientNutrition(entry.reference_item_id, entry.label);
          if (!nutrition) return { status: 'unavailable' as const };
          const totals = scaleNutrition(nutrition, grams);
          if (!totals) return { status: 'unavailable' as const };
          const warnings: string[] = [];
          if (isApproxUnit(entry.unit)) warnings.push(REASON_APPROX_UNIT);
          if (!hasKnownTranslation(entry.label)) warnings.push(REASON_UNKNOWN_TRANSLATION);
          const gi = giFor(entry.label);
          if (gi !== null) {
            totals.glycemic_load = (gi * totals.carbs_g) / 100;
          } else if (totals.carbs_g >= 1) {
            warnings.push(REASON_UNKNOWN_GI);
          }
          return { status: 'ok' as const, totals, partial: false, warnings, grams, gi };
        }

        if (!entry.recipe_id) return { status: 'unavailable' as const };
        const recipe = await getRecipe(entry.recipe_id);
        let sum = emptyTotals();
        let anyFound = false;
        let partial = false;
        let anyApproxUnit = false;
        let anyUnknownTranslation = false;
        let anyUnknownGI = false;

        for (const ing of recipe.ingredients) {
          const qty = parseFloat(ing.quantity.replace(',', '.'));
          const refId = ingredientNameToId.get(ing.ingredient.trim().toLowerCase());
          if (!refId || Number.isNaN(qty) || !ing.unit) {
            partial = true;
            continue;
          }
          const grams = gramsForQuantity(qty, ing.unit, ing.ingredient);
          if (grams === null) {
            partial = true;
            continue;
          }
          const nutrition = await getIngredientNutrition(refId, ing.ingredient);
          if (!nutrition) {
            partial = true;
            continue;
          }
          const scaled = scaleNutrition(nutrition, grams);
          if (!scaled) {
            partial = true;
            continue;
          }
          const gi = giFor(ing.ingredient);
          if (gi !== null) {
            scaled.glycemic_load = (gi * scaled.carbs_g) / 100;
          } else if (scaled.carbs_g >= 1) {
            anyUnknownGI = true;
          }
          sum = addTotals(sum, scaled);
          anyFound = true;
          if (isApproxUnit(ing.unit)) anyApproxUnit = true;
          if (!hasKnownTranslation(ing.ingredient)) anyUnknownTranslation = true;
        }

        if (!anyFound) return { status: 'unavailable' as const };
        const factor = entry.quantity;
        const scaledSum = emptyTotals();
        for (const key of Object.keys(sum) as (keyof NutritionTotals)[]) {
          scaledSum[key] = sum[key] * factor;
        }
        const warnings: string[] = [];
        if (partial) warnings.push(REASON_PARTIAL_RECIPE);
        if (anyApproxUnit) warnings.push(REASON_APPROX_UNIT);
        if (anyUnknownTranslation) warnings.push(REASON_UNKNOWN_TRANSLATION);
        if (anyUnknownGI) warnings.push(REASON_UNKNOWN_GI);
        return { status: 'ok' as const, totals: scaledSum, partial, warnings, grams: null, gi: null };
      };

      compute()
        .then((result) => {
          if (!cancelled) setNutritionByEntry((prev) => ({ ...prev, [entry.id]: result }));
        })
        .catch(() => {
          if (!cancelled) setNutritionByEntry((prev) => ({ ...prev, [entry.id]: { status: 'unavailable' } }));
        });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, ingredientNameToId]);

  const dayTotals = useMemo(() => {
    let totals = emptyTotals();
    let hasAny = false;
    let hasPartial = false;
    let hasWarning = false;
    for (const entry of entries) {
      const state = nutritionByEntry[entry.id];
      if (state?.status === 'ok') {
        totals = addTotals(totals, state.totals);
        hasAny = true;
        if (state.partial) hasPartial = true;
        if (state.warnings.length > 0) hasWarning = true;
      } else {
        hasPartial = true;
      }
    }
    return { totals, hasAny, hasPartial, hasWarning };
  }, [entries, nutritionByEntry]);

  const dailyTargets: DailyTargets | null = useMemo(
    () => (profile ? computeDailyTargets(profile) : null),
    [profile],
  );

  const dayGi = useMemo(() => {
    if (dayTotals.totals.carbs_g < 1) return null;
    return (dayTotals.totals.glycemic_load / dayTotals.totals.carbs_g) * 100;
  }, [dayTotals]);

  const entriesByMeal = useMemo(() => {
    const groups = new Map<string, JournalEntry[]>();
    for (const entry of entries) {
      const list = groups.get(entry.meal) ?? [];
      list.push(entry);
      groups.set(entry.meal, list);
    }
    const orderedMeals = [...MEALS, ...[...groups.keys()].filter((m) => !(MEALS as readonly string[]).includes(m))];
    return orderedMeals
      .filter((meal) => groups.has(meal))
      .map((meal) => {
        const mealEntries = groups.get(meal)!;
        let mealTotals = emptyTotals();
        for (const entry of mealEntries) {
          const state = nutritionByEntry[entry.id];
          if (state?.status === 'ok') mealTotals = addTotals(mealTotals, state.totals);
        }
        return { meal, entries: mealEntries, totals: mealTotals };
      });
  }, [entries, nutritionByEntry]);

  const addIngredientOption = (name: string) => {
    if (!name) return;
    addReferenceItem('ingredient', name)
      .then((item) => setIngredientItems((prev) => (prev.some((i) => i.id === item.id) ? prev : [...prev, item])))
      .catch(() => {});
  };

  const addUnitOption = (name: string) => {
    if (!name) return;
    setUnitOptions((prev) => (prev.includes(name) ? prev : [...prev, name]));
  };

  const selectedRecipe = recipeByTitle.get(ingName.trim().toLowerCase());

  const handleAddFood = async (e: FormEvent) => {
    e.preventDefault();
    setIngError(null);
    const qty = parseFloat(ingQty.replace(',', '.'));

    if (selectedRecipe) {
      if (Number.isNaN(qty)) {
        setIngError('Renseigne un nombre de portions valide.');
        return;
      }
      try {
        await addJournalEntry({
          entry_date: dateKey,
          kind: 'recipe',
          reference_item_id: null,
          recipe_id: selectedRecipe.id,
          label: selectedRecipe.title,
          quantity: qty,
          unit: null,
          meal: selectedMeal,
        });
        setIngName('');
        setIngQty('');
        setIngUnit('');
        loadEntries(dateKey);
      } catch (err) {
        setIngError(err instanceof Error ? err.message : 'Une erreur est survenue.');
      }
      return;
    }

    if (!ingName.trim() || Number.isNaN(qty) || !ingUnit.trim()) {
      setIngError('Renseigne un aliment, une quantité et une mesure.');
      return;
    }
    try {
      let refId = ingredientNameToId.get(ingName.trim().toLowerCase());
      if (!refId) {
        const item = await addReferenceItem('ingredient', ingName.trim());
        refId = item.id;
        setIngredientItems((prev) => [...prev, item]);
      }
      await addJournalEntry({
        entry_date: dateKey,
        kind: 'ingredient',
        reference_item_id: refId,
        recipe_id: null,
        label: ingName.trim(),
        quantity: qty,
        unit: ingUnit.trim(),
        meal: selectedMeal,
      });
      setIngName('');
      setIngQty('');
      setIngUnit('');
      loadEntries(dateKey);
    } catch (err) {
      setIngError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };

  const handleDelete = async (id: string) => {
    await deleteJournalEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <section className="journal">
      <div className="journal-date-nav">
        <button type="button" onClick={() => setDateKey((d) => addDays(d, -1))}>
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
        <button type="button" onClick={() => setDateKey((d) => addDays(d, 1))}>
          Lendemain →
        </button>
      </div>

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
        {dayGi !== null && (
          <p className={`gi-appreciation ${giAppreciation(dayGi).className}`}>
            IG global du jour : {Math.round(dayGi)} ({giAppreciation(dayGi).label})
          </p>
        )}
        {(dayTotals.hasPartial || dayTotals.hasWarning) && (
          <p className="hint warning-hint">
            ⚠️ Estimation approximative : certaines lignes ci-dessous sont marquées ⚠️ (survole
            l'icône pour savoir pourquoi) ou affichent "?" quand aucune valeur n'a pu être calculée.
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
            </ul>
          </details>
        )}
      </div>

      {loading && <p>Chargement…</p>}
      {error && <p className="error">{error}</p>}

      {entriesByMeal.map(({ meal, entries: mealEntries, totals: mealTotals }) => (
        <div className="journal-meal-group" key={meal}>
          <div className="journal-meal-header">
            <h3>{meal}</h3>
            <span>{Math.round(mealTotals.calories_kcal)} kcal</span>
          </div>
          {dailyTargets && (
            <p className="journal-meal-bilan">
              {Math.round(mealTotals.calories_kcal)} kcal (
              {Math.round((mealTotals.calories_kcal / dailyTargets.calories_kcal) * 100)}% du jour) ·{' '}
              {Math.round(mealTotals.protein_g)} g protéines (
              {Math.round((mealTotals.protein_g / dailyTargets.protein_g) * 100)}%) ·{' '}
              {Math.round(mealTotals.carbs_g)} g glucides (
              {Math.round((mealTotals.carbs_g / dailyTargets.carbs_g) * 100)}%) ·{' '}
              {Math.round(mealTotals.fat_g)} g lipides (
              {Math.round((mealTotals.fat_g / dailyTargets.fat_g) * 100)}%)
            </p>
          )}
          <ul className="journal-entry-list">
            {mealEntries.map((entry) => {
              const state = nutritionByEntry[entry.id];
              return (
                <li key={entry.id} className="journal-entry">
                  <div className="journal-entry-main">
                    <span className="journal-entry-label">{entry.label}</span>
                    <span className="journal-entry-qty">
                      {entry.quantity} {entry.kind === 'recipe' ? 'portion(s)' : entry.unit}
                      {state?.status === 'ok' && state.grams !== null && entry.unit !== 'g' && (
                        <> (≈{Math.round(state.grams)} g)</>
                      )}
                    </span>
                  </div>
                  <span className="journal-entry-kcal">
                    {state?.status === 'ok' ? (
                      <>
                        {Math.round(state.totals.calories_kcal)} kcal
                        {state.gi !== null && <span className="journal-gi-badge">IG {state.gi}</span>}
                        {state.warnings.length > 0 && (
                          <span className="warning-icon" title={state.warnings.join(' • ')} aria-label="Attention">
                            {' '}
                            ⚠️
                          </span>
                        )}
                      </>
                    ) : state?.status === 'loading' ? (
                      '…'
                    ) : (
                      <span className="warning-icon unavailable" title={REASON_UNAVAILABLE} aria-label="Donnée indisponible">
                        ? kcal ⚠️
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    className="remove-row"
                    onClick={() => handleDelete(entry.id)}
                    aria-label={`Supprimer ${entry.label}`}
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      {!loading && entries.length === 0 && <p className="empty">Rien noté pour ce jour.</p>}

      <div className="journal-meal-picker">
        <label htmlFor="journal-meal-select">Repas :</label>
        <select id="journal-meal-select" value={selectedMeal} onChange={(e) => setSelectedMeal(e.target.value)}>
          {MEALS.map((meal) => (
            <option key={meal} value={meal}>
              {meal}
            </option>
          ))}
        </select>
      </div>

      <div className="journal-add-forms">
        <form className="journal-add-form" onSubmit={handleAddFood}>
          <h3>Ajouter un aliment</h3>
          <p className="hint">
            Un ingrédient brut (pomme, riz…) ou un de tes plats — dans ce cas le calcul se fait
            automatiquement à partir de ses ingrédients, selon le nombre de portions.
          </p>
          {ingError && <p className="error">{ingError}</p>}
          <div className={`journal-add-row${selectedRecipe ? ' two-cols' : ''}`}>
            <input
              type="number"
              step="any"
              value={ingQty}
              onChange={(e) => setIngQty(e.target.value)}
              placeholder={selectedRecipe ? 'Portions' : 'Nb'}
              className="ingredient-qty"
            />
            {!selectedRecipe && (
              <SearchableSelect
                id="journal-unit"
                value={ingUnit}
                onChange={setIngUnit}
                options={unitOptions}
                placeholder="Mesure"
                onAddNew={addUnitOption}
                maxResults={40}
              />
            )}
            <SearchableSelect
              id="journal-ingredient"
              value={ingName}
              onChange={setIngName}
              options={[...ingredientItems.map((i) => i.name), ...recipes.map((r) => r.title)]}
              placeholder="Ingrédient ou plat"
              onAddNew={addIngredientOption}
            />
          </div>
          {selectedRecipe && <p className="hint">Plat de ta bibliothèque : {selectedRecipe.title}.</p>}
          <button type="submit">Ajouter</button>
        </form>
      </div>
    </section>
  );
}
