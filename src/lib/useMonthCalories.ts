import { useEffect, useState } from 'react';
import { gramsForQuantity } from './unitConversion';
import { computeDailyTargets } from './dailyNeeds';
import { listJournalEntriesInRange } from '../api/journal';
import { getIngredientNutrition } from '../api/nutrition';
import { listReferenceItems } from '../api/referenceItems';
import { listRecipes } from '../api/recipes';
import { getProfile } from '../api/profile';
import type { JournalEntry, Recipe } from '../types';

export interface DayStatus {
  calories: number;
  hasData: boolean;
}

/** Calcule, pour chaque jour d'un mois, le total de calories consommées —
 * volontairement plus léger que useDayNutrition (pas d'IG, pas de warnings) :
 * juste de quoi colorer une case de calendrier. */
export function useMonthCalories(monthKey: string) {
  const [caloriesByDate, setCaloriesByDate] = useState<Record<string, DayStatus>>({});
  const [loading, setLoading] = useState(true);
  const [targetCalories, setTargetCalories] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const [year, month] = monthKey.split('-').map(Number);
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    Promise.all([
      listJournalEntriesInRange(startDate, endDate),
      listRecipes(),
      listReferenceItems('ingredient'),
      getProfile(),
    ])
      .then(async ([entries, recipes, ingredientItems, profile]) => {
        if (cancelled) return;

        const targets = profile ? computeDailyTargets(profile) : null;
        setTargetCalories(targets?.calories_kcal ?? null);

        const recipesById = new Map<string, Recipe>(recipes.map((r) => [r.id, r]));
        const ingredientNameToId = new Map<string, string>(
          ingredientItems.map((i) => [i.name.toLowerCase(), i.id]),
        );
        const pieceWeights = new Map<string, number>(
          ingredientItems
            .filter((i) => i.piece_weight_g != null)
            .map((i) => [i.name.toLowerCase(), i.piece_weight_g as number]),
        );

        const caloriesForEntry = async (entry: JournalEntry): Promise<number> => {
          if (entry.kind === 'ingredient') {
            if (!entry.reference_item_id || !entry.unit) return 0;
            const grams = gramsForQuantity(
              entry.quantity,
              entry.unit,
              entry.label,
              pieceWeights.get(entry.label.trim().toLowerCase()),
            );
            if (grams === null) return 0;
            const nutrition = await getIngredientNutrition(entry.reference_item_id, entry.label);
            return nutrition?.calories_kcal ? (nutrition.calories_kcal * grams) / 100 : 0;
          }

          if (!entry.recipe_id) return 0;
          const recipe = recipesById.get(entry.recipe_id);
          if (!recipe) return 0;
          let sum = 0;
          for (const ing of recipe.ingredients) {
            const qty = parseFloat(ing.quantity.replace(',', '.'));
            const refId = ingredientNameToId.get(ing.ingredient.trim().toLowerCase());
            if (!refId || Number.isNaN(qty) || !ing.unit) continue;
            const grams = gramsForQuantity(
              qty,
              ing.unit,
              ing.ingredient,
              pieceWeights.get(ing.ingredient.trim().toLowerCase()),
            );
            if (grams === null) continue;
            const nutrition = await getIngredientNutrition(refId, ing.ingredient);
            if (nutrition?.calories_kcal) sum += (nutrition.calories_kcal * grams) / 100;
          }
          return sum * entry.quantity;
        };

        const byDate: Record<string, DayStatus> = {};
        for (const entry of entries) {
          const calories = await caloriesForEntry(entry);
          const prev = byDate[entry.entry_date] ?? { calories: 0, hasData: false };
          byDate[entry.entry_date] = { calories: prev.calories + calories, hasData: true };
        }
        if (!cancelled) setCaloriesByDate(byDate);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [monthKey]);

  return { caloriesByDate, targetCalories, loading };
}
