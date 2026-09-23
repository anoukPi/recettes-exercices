import { useEffect, useState } from 'react';
import { addTotals, emptyTotals, scaleNutrition } from './nutritionCalc';
import { gramsForQuantity, isApproxUnit } from './unitConversion';
import { hasNutritionSource } from './nutritionLookup';
import { giFor } from './glycemicIndex';
import { getIngredientNutrition } from '../api/nutrition';
import { listReferenceItems } from '../api/referenceItems';
import type { NutritionTotals, Recipe } from '../types';

export interface RecipeNutritionResult {
  totals: NutritionTotals;
  partial: boolean;
  /** Au moins un ingrédient mesuré en unité approximative (pièce, cuillère, tasse…). */
  approx: boolean;
  anyFound: boolean;
  avgGi: number | null;
}

/** Calcule les valeurs nutritionnelles totales d'une recette (somme de ses
 * ingrédients tels qu'écrits — pas de notion de "portion" sur la recette
 * elle-même, voir la quantité au moment de l'ajout au carnet pour ça). */
export function useRecipeNutrition(recipe: Recipe | null) {
  const [result, setResult] = useState<RecipeNutritionResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!recipe) {
      setResult(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    listReferenceItems('ingredient')
      .then(async (items) => {
        if (cancelled) return;
        const ingredientNameToId = new Map(items.map((i) => [i.name.toLowerCase(), i.id]));
        const pieceWeights = new Map(
          items.filter((i) => i.piece_weight_g != null).map((i) => [i.name.toLowerCase(), i.piece_weight_g as number]),
        );

        let sum = emptyTotals();
        let anyFound = false;
        let partial = false;
        let approx = false;

        for (const ing of recipe.ingredients) {
          try {
            const qty = parseFloat(ing.quantity.replace(',', '.'));
            const refId = ingredientNameToId.get(ing.ingredient.trim().toLowerCase());
            if (!refId || Number.isNaN(qty) || !ing.unit) {
              partial = true;
              continue;
            }
            const grams = gramsForQuantity(qty, ing.unit, ing.ingredient, pieceWeights.get(ing.ingredient.trim().toLowerCase()));
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
            if (gi !== null) scaled.glycemic_load = (gi * scaled.carbs_g) / 100;
            sum = addTotals(sum, scaled);
            anyFound = true;
            if (isApproxUnit(ing.unit)) approx = true;
            if (nutrition.source !== 'manual' && !hasNutritionSource(ing.ingredient)) partial = true;
          } catch {
            partial = true;
          }
        }

        const avgGi = sum.carbs_g >= 1 ? (sum.glycemic_load / sum.carbs_g) * 100 : null;

        if (!cancelled) setResult({ totals: sum, partial, approx, anyFound, avgGi });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [recipe]);

  return { result, loading };
}
