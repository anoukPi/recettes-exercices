import { useEffect, useState } from 'react';
import { gramsForQuantity } from './unitConversion';
import { computeDailyTargets, type DailyTargets } from './dailyNeeds';
import { listJournalEntriesInRange } from '../api/journal';
import { listActivityEntriesInRange } from '../api/activities';
import { listCycleEntries } from '../api/cycle';
import { getIngredientNutrition } from '../api/nutrition';
import { listReferenceItems } from '../api/referenceItems';
import { listRecipes } from '../api/recipes';
import { getProfile } from '../api/profile';
import type { ActivityEntry, JournalEntry, Recipe } from '../types';

export interface DaySummary {
  date: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  omega3_g: number;
  omega6_g: number;
  omega9_g: number;
  fiber_g: number;
  sugar_g: number;
  fat_saturated_g: number;
  activityCalories: number;
  activities: ActivityEntry[];
  hasData: boolean;
  hasPeriod: boolean;
}

/** Résumé léger jour par jour sur une plage de dates — pour les vues
 * hebdomadaire/mensuelle. Volontairement plus simple que useDayNutrition
 * (pas d'IG/CG ni de warnings détaillés) : juste de quoi calculer des
 * écarts moyens et un taux d'activité. */
export function usePeriodSummary(startDate: string, endDate: string) {
  const [days, setDays] = useState<DaySummary[]>([]);
  const [dailyTargets, setDailyTargets] = useState<DailyTargets | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      listJournalEntriesInRange(startDate, endDate),
      listActivityEntriesInRange(startDate, endDate),
      listCycleEntries(),
      listRecipes(),
      listReferenceItems('ingredient'),
      getProfile(),
    ])
      .then(async ([journalEntries, activityEntries, cycleEntries, recipes, ingredientItems, profile]) => {
        if (cancelled) return;

        const targets = profile ? computeDailyTargets(profile) : null;
        setDailyTargets(targets);

        const recipesById = new Map<string, Recipe>(recipes.map((r) => [r.id, r]));
        const ingredientNameToId = new Map<string, string>(
          ingredientItems.map((i) => [i.name.toLowerCase(), i.id]),
        );
        const pieceWeights = new Map<string, number>(
          ingredientItems.filter((i) => i.piece_weight_g != null).map((i) => [i.name.toLowerCase(), i.piece_weight_g as number]),
        );

        const nutritionForEntry = async (entry: JournalEntry) => {
          const empty = { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, omega3_g: 0, omega6_g: 0, omega9_g: 0, fiber_g: 0, sugar_g: 0, fat_saturated_g: 0 };
          if (entry.kind === 'ingredient') {
            if (!entry.reference_item_id || !entry.unit) return empty;
            const grams = gramsForQuantity(
              entry.quantity,
              entry.unit,
              entry.label,
              pieceWeights.get(entry.label.trim().toLowerCase()),
            );
            if (grams === null) return empty;
            const nutrition = await getIngredientNutrition(entry.reference_item_id, entry.label);
            if (!nutrition?.calories_kcal) return empty;
            const factor = grams / 100;
            return {
              calories: nutrition.calories_kcal * factor,
              protein_g: (nutrition.protein_g ?? 0) * factor,
              carbs_g: (nutrition.carbs_g ?? 0) * factor,
              fat_g: (nutrition.fat_g ?? 0) * factor,
              omega3_g: (nutrition.omega3_g ?? 0) * factor,
              omega6_g: (nutrition.omega6_g ?? 0) * factor,
              omega9_g: (nutrition.omega9_g ?? 0) * factor,
              fiber_g: (nutrition.fiber_g ?? 0) * factor,
              sugar_g: (nutrition.sugar_g ?? 0) * factor,
              fat_saturated_g: (nutrition.fat_saturated_g ?? 0) * factor,
            };
          }

          if (!entry.recipe_id) return empty;
          const recipe = recipesById.get(entry.recipe_id);
          if (!recipe) return empty;
          let sum = { ...empty };
          for (const ing of recipe.ingredients) {
            try {
              const qty = parseFloat(ing.quantity.replace(',', '.'));
              const refId = ingredientNameToId.get(ing.ingredient.trim().toLowerCase());
              if (!refId || Number.isNaN(qty) || !ing.unit) continue;
              const grams = gramsForQuantity(qty, ing.unit, ing.ingredient, pieceWeights.get(ing.ingredient.trim().toLowerCase()));
              if (grams === null) continue;
              const nutrition = await getIngredientNutrition(refId, ing.ingredient);
              if (!nutrition?.calories_kcal) continue;
              const factor = grams / 100;
              sum = {
                calories: sum.calories + nutrition.calories_kcal * factor,
                protein_g: sum.protein_g + (nutrition.protein_g ?? 0) * factor,
                carbs_g: sum.carbs_g + (nutrition.carbs_g ?? 0) * factor,
                fat_g: sum.fat_g + (nutrition.fat_g ?? 0) * factor,
                omega3_g: sum.omega3_g + (nutrition.omega3_g ?? 0) * factor,
                omega6_g: sum.omega6_g + (nutrition.omega6_g ?? 0) * factor,
                omega9_g: sum.omega9_g + (nutrition.omega9_g ?? 0) * factor,
                fiber_g: sum.fiber_g + (nutrition.fiber_g ?? 0) * factor,
                sugar_g: sum.sugar_g + (nutrition.sugar_g ?? 0) * factor,
                fat_saturated_g: sum.fat_saturated_g + (nutrition.fat_saturated_g ?? 0) * factor,
              };
            } catch {
              // un ingrédient en échec ne doit pas casser le calcul du jour entier
            }
          }
          const portionFactor = entry.quantity;
          return {
            calories: sum.calories * portionFactor,
            protein_g: sum.protein_g * portionFactor,
            carbs_g: sum.carbs_g * portionFactor,
            fat_g: sum.fat_g * portionFactor,
            omega3_g: sum.omega3_g * portionFactor,
            omega6_g: sum.omega6_g * portionFactor,
            omega9_g: sum.omega9_g * portionFactor,
            fiber_g: sum.fiber_g * portionFactor,
            sugar_g: sum.sugar_g * portionFactor,
            fat_saturated_g: sum.fat_saturated_g * portionFactor,
          };
        };

        const byDate = new Map<string, DaySummary>();
        const addDate = (date: string) => {
          if (!byDate.has(date)) {
            byDate.set(date, {
              date,
              calories: 0,
              protein_g: 0,
              carbs_g: 0,
              fat_g: 0,
              omega3_g: 0,
              omega6_g: 0,
              omega9_g: 0,
              fiber_g: 0,
              sugar_g: 0,
              fat_saturated_g: 0,
              activityCalories: 0,
              activities: [],
              hasData: false,
              hasPeriod: false,
            });
          }
          return byDate.get(date)!;
        };

        for (const entry of journalEntries) {
          try {
            const nutrition = await nutritionForEntry(entry);
            const day = addDate(entry.entry_date);
            day.calories += nutrition.calories;
            day.protein_g += nutrition.protein_g;
            day.carbs_g += nutrition.carbs_g;
            day.fat_g += nutrition.fat_g;
            day.omega3_g += nutrition.omega3_g;
            day.omega6_g += nutrition.omega6_g;
            day.omega9_g += nutrition.omega9_g;
            day.fiber_g += nutrition.fiber_g;
            day.sugar_g += nutrition.sugar_g;
            day.fat_saturated_g += nutrition.fat_saturated_g;
            day.hasData = true;
          } catch {
            // une entrée en échec ne doit pas casser le résumé de toute la période
          }
        }

        for (const activity of activityEntries) {
          const day = addDate(activity.entry_date);
          day.activityCalories += activity.calories_kcal;
          day.activities.push(activity);
        }

        for (const cycle of cycleEntries) {
          if (cycle.entry_date >= startDate && cycle.entry_date <= endDate) {
            addDate(cycle.entry_date).hasPeriod = true;
          }
        }

        const sorted = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
        if (!cancelled) setDays(sorted);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [startDate, endDate]);

  return { days, dailyTargets, loading };
}
