import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SearchableSelect } from '../components/SearchableSelect';
import { addDays, defaultMealForNow, formatDateKeyFr, toDateKey } from '../lib/date';
import { suggestUnit } from '../lib/unitSuggestion';
import { disambiguationFor } from '../lib/ingredientDisambiguation';
import { parseIngredientLine } from '../lib/captionParser';
import { DictationButton } from '../components/DictationButton';
import { useDayNutrition, REASON_UNAVAILABLE } from '../lib/useDayNutrition';
import { addJournalEntry, deleteJournalEntry, updateJournalEntryQuantity } from '../api/journal';
import { addReferenceItem, listReferenceItems, type ReferenceItem } from '../api/referenceItems';
import { listRecipes } from '../api/recipes';
import { useSession } from '../lib/auth';
import { ManualNutritionForm } from '../components/ManualNutritionForm';
import { MEALS, type JournalEntry, type Recipe } from '../types';

export function MealsPage() {
  const { session, loading: authLoading } = useSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const dateKey = searchParams.get('date') || toDateKey(new Date());
  const setDateKey = (next: string) => setSearchParams({ date: next });

  const { entries, setEntries, loading, error, dailyTargets, nutritionByEntry, entriesByMeal, reload } =
    useDayNutrition(dateKey);

  const [ingredientItems, setIngredientItems] = useState<ReferenceItem[]>([]);
  const [unitOptions, setUnitOptions] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  const [ingName, setIngName] = useState('');
  const [ingQty, setIngQty] = useState('');
  const [ingUnit, setIngUnit] = useState('');
  const [ingError, setIngError] = useState<string | null>(null);

  const [selectedMeal, setSelectedMeal] = useState<string>(defaultMealForNow());
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingQty, setEditingQty] = useState('');

  useEffect(() => {
    listReferenceItems('ingredient').then(setIngredientItems).catch(() => {});
    listReferenceItems('unit')
      .then((items) => setUnitOptions(items.map((i) => i.name)))
      .catch(() => {});
    listRecipes().then(setRecipes).catch(() => {});
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
  const [dismissedAmbiguous, setDismissedAmbiguous] = useState<string | null>(null);
  const ambiguousVariants =
    ingName.trim().toLowerCase() !== dismissedAmbiguous ? disambiguationFor(ingName) : null;

  const handleIngNameChange = (name: string) => {
    setIngName(name);
    if (!ingUnit && !recipeByTitle.has(name.trim().toLowerCase())) {
      const suggested = suggestUnit(name);
      if (suggested) setIngUnit(suggested);
    }
  };

  const pickVariant = (variant: string) => {
    handleIngNameChange(variant);
    setDismissedAmbiguous(variant.trim().toLowerCase());
  };

  const handleDictateIngredient = (transcript: string) => {
    const parsed = parseIngredientLine(transcript);
    if (!parsed) return;
    if (parsed.quantity) setIngQty(parsed.quantity);
    handleIngNameChange(parsed.ingredient);
    if (parsed.unit) setIngUnit(parsed.unit);
  };

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
        reload();
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
      reload();
    } catch (err) {
      setIngError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    }
  };

  const handleDelete = async (id: string) => {
    await deleteJournalEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const startEditQty = (entry: JournalEntry) => {
    setEditingEntryId(entry.id);
    setEditingQty(String(entry.quantity));
  };

  const cancelEditQty = () => {
    setEditingEntryId(null);
    setEditingQty('');
  };

  const saveEditQty = async (id: string) => {
    const qty = parseFloat(editingQty.replace(',', '.'));
    if (Number.isNaN(qty) || qty <= 0) return;
    const updated = await updateJournalEntryQuantity(id, qty);
    setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
    cancelEditQty();
  };

  if (authLoading) return null;

  if (!session) {
    return (
      <section className="journal">
        <p className="hint">
          Connecte-toi dans <Link to="/settings">Paramètres</Link> pour voir et remplir tes repas.
        </p>
      </section>
    );
  }

  return (
    <section className="journal">
      <Link to={`/journal?date=${dateKey}`} className="back-link">
        ← Résumé du jour
      </Link>

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

      {entriesByMeal.length > 0 && (
        <details className="gi-explainer">
          <summary>ℹ️ IG / CG — quelle différence ?</summary>
          <p className="hint">
            <strong>IG</strong> : vitesse à laquelle l'aliment fait monter la glycémie, fixe peu
            importe la quantité. <strong>CG</strong> : IG × la quantité de glucides de cette
            portion précise — l'impact réel de ce que tu manges là, maintenant.
          </p>
        </details>
      )}

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
              const canFixManually = state?.status === 'unavailable' && entry.kind === 'ingredient' && entry.reference_item_id;
              return (
                <li key={entry.id} className={`journal-entry${canFixManually ? ' activity-entry' : ''}`}>
                  <div className="journal-entry-row">
                  <div className="journal-entry-main">
                    <span className="journal-entry-label">{entry.label}</span>
                    {editingEntryId === entry.id ? (
                      <span className="journal-entry-qty-edit">
                        <input
                          type="number"
                          step="any"
                          value={editingQty}
                          onChange={(e) => setEditingQty(e.target.value)}
                          autoFocus
                        />
                        <button type="button" onClick={() => saveEditQty(entry.id)}>
                          ✓
                        </button>
                        <button type="button" className="link-button" onClick={cancelEditQty}>
                          Annuler
                        </button>
                      </span>
                    ) : (
                      <span
                        className="journal-entry-qty editable"
                        onClick={() => startEditQty(entry)}
                        title="Modifier la quantité"
                      >
                        {entry.quantity} {entry.kind === 'recipe' ? 'portion(s)' : entry.unit}
                        {state?.status === 'ok' && state.grams !== null && entry.unit !== 'g' && (
                          <> (≈{Math.round(state.grams)} g)</>
                        )}
                        {' ✎'}
                      </span>
                    )}
                  </div>
                  <span className="journal-entry-kcal">
                    {state?.status === 'ok' ? (
                      <>
                        {Math.round(state.totals.calories_kcal)} kcal
                        {state.gi !== null && (
                          <span className="journal-gi-badge" title="Indice glycémique de l'aliment">
                            IG {state.gi}
                          </span>
                        )}
                        {state.totals.glycemic_load > 0 && (
                          <span
                            className="journal-gi-badge journal-gl-badge"
                            title="Charge glycémique de cette portion (IG × quantité de glucides mangée)"
                          >
                            CG {Math.round(state.totals.glycemic_load)}
                          </span>
                        )}
                      </>
                    ) : state?.status === 'loading' ? (
                      '…'
                    ) : (
                      <span className="warning-icon unavailable" title={REASON_UNAVAILABLE} aria-label="Donnée indisponible">
                        ? kcal
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
                  </div>
                  {canFixManually && (
                    <ManualNutritionForm
                      referenceItemId={entry.reference_item_id!}
                      label={entry.label}
                      unit={entry.unit ?? ''}
                      onSaved={reload}
                    />
                  )}
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
              onChange={handleIngNameChange}
              options={[...ingredientItems.map((i) => i.name), ...recipes.map((r) => r.title)]}
              placeholder="Ingrédient ou plat"
              onAddNew={addIngredientOption}
            />
            {!selectedRecipe && (
              <DictationButton title="Dicter (ex: 100 grammes de riz)" onResult={handleDictateIngredient} />
            )}
          </div>
          {selectedRecipe && <p className="hint">Plat de ta bibliothèque : {selectedRecipe.title}.</p>}
          {ambiguousVariants && (
            <div className="disambiguation">
              <p className="hint">« {ingName.trim()} » regroupe des aliments assez différents — précise :</p>
              <div className="tag-filter">
                {ambiguousVariants.map((variant) => (
                  <button
                    key={variant}
                    type="button"
                    className="tag-chip"
                    onClick={() => pickVariant(variant)}
                  >
                    {variant}
                  </button>
                ))}
                <button
                  type="button"
                  className="tag-chip clear"
                  onClick={() => setDismissedAmbiguous(ingName.trim().toLowerCase())}
                >
                  Garder « {ingName.trim()} »
                </button>
              </div>
            </div>
          )}
          <button type="submit">Ajouter</button>
        </form>
      </div>
    </section>
  );
}
