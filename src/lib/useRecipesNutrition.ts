import { useEffect, useState } from 'react';
import { addTotals, emptyTotals, scaleNutrition } from './nutritionCalc';
import { gramsForQuantity } from './unitConversion';
import { giFor } from './glycemicIndex';
import { getIngredientNutrition } from '../api/nutrition';
import { listReferenceItems } from '../api/referenceItems';
import type { Recipe } from '../types';

export interface RecipeCardNutrition {
  calories: number;
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
  avgGi: number | null;
}

/** Nutrition résumée pour chaque recette d'une liste — pour un sous-titre de
 * carte (calories, % macros, IG), pas le détail complet de la page recette. */
export function useRecipesNutrition(recipes: Recipe[]) {
  const [byId, setById] = useState<Record<string, RecipeCardNutrition>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (recipes.length === 0) {
      setById({});
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

        const result: Record<string, RecipeCardNutrition> = {};

        for (const recipe of recipes) {
          let sum = emptyTotals();
          let anyFound = false;

          for (const ing of recipe.ingredients) {
            try {
              const qty = parseFloat(ing.quantity.replace(',', '.'));
              const refId = ingredientNameToId.get(ing.ingredient.trim().toLowerCase());
              if (!refId || Number.isNaN(qty) || !ing.unit) continue;
              const grams = gramsForQuantity(qty, ing.unit, ing.ingredient, pieceWeights.get(ing.ingredient.trim().toLowerCase()));
              if (grams === null) continue;
              const nutrition = await getIngredientNutrition(refId, ing.ingredient);
              if (!nutrition) continue;
              const scaled = scaleNutrition(nutrition, grams);
              if (!scaled) continue;
              const gi = giFor(ing.ingredient);
              if (gi !== null) scaled.glycemic_load = (gi * scaled.carbs_g) / 100;
              sum = addTotals(sum, scaled);
              anyFound = true;
            } catch {
              // Un ingrédient qui échoue (recherche USDA en erreur, etc.) ne
              // doit pas bloquer le calcul des autres ingrédients/recettes.
            }
          }

          if (!anyFound || sum.calories_kcal <= 0) continue;

          result[recipe.id] = {
            calories: sum.calories_kcal,
            proteinPct: Math.round(((sum.protein_g * 4) / sum.calories_kcal) * 100),
            carbsPct: Math.round(((sum.carbs_g * 4) / sum.calories_kcal) * 100),
            fatPct: Math.round(((sum.fat_g * 9) / sum.calories_kcal) * 100),
            avgGi: sum.carbs_g >= 1 ? (sum.glycemic_load / sum.carbs_g) * 100 : null,
          };
        }

        if (!cancelled) setById(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipes]);

  return { byId, loading };
}
