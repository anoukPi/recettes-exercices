import { useEffect, useState } from 'react';
import { addTotals, emptyTotals, scaleNutrition } from './nutritionCalc';
import { gramsForQuantity, isApproxUnit } from './unitConversion';
import { hasNutritionSource } from './nutritionLookup';
import { giFor } from './glycemicIndex';
import { getIngredientNutrition } from '../api/nutrition';
import { listReferenceItems } from '../api/referenceItems';
import type { NutritionTotals, Recipe } from '../types';

/** Ingrédient non compté dans le calcul, et pourquoi — pour proposer de le
 * compléter directement depuis la fiche recette. */
export interface RecipeIngredientIssue {
  ingredient: string;
  unit: string;
  /** 'inconnu' : aucune valeur nutritive connue ; 'poids' : on ne sait pas
   * combien pèse 1 unité/pièce ; 'quantite' : quantité ou mesure manquante. */
  reason: 'inconnu' | 'poids' | 'quantite';
  referenceItemId: string | null;
}

export interface RecipeNutritionResult {
  totals: NutritionTotals;
  partial: boolean;
  /** Au moins un ingrédient mesuré en unité approximative (pièce, cuillère, tasse…). */
  approx: boolean;
  anyFound: boolean;
  avgGi: number | null;
  issues: RecipeIngredientIssue[];
}

/** Calcule les valeurs nutritionnelles totales d'une recette (somme de ses
 * ingrédients tels qu'écrits — pas de notion de "portion" sur la recette
 * elle-même, voir la quantité au moment de l'ajout au carnet pour ça). */
export function useRecipeNutrition(recipe: Recipe | null) {
  const [result, setResult] = useState<RecipeNutritionResult | null>(null);
  const [loading, setLoading] = useState(true);
  // Incrémenté par reload() : recalcul après avoir complété un ingrédient.
  const [version, setVersion] = useState(0);

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
        const issues: RecipeIngredientIssue[] = [];

        for (const ing of recipe.ingredients) {
          try {
            if (!ing.ingredient.trim()) continue;
            const qty = parseFloat(ing.quantity.replace(',', '.'));
            const refId = ingredientNameToId.get(ing.ingredient.trim().toLowerCase()) ?? null;
            const issue = (reason: RecipeIngredientIssue['reason']) =>
              issues.push({ ingredient: ing.ingredient.trim(), unit: ing.unit ?? '', reason, referenceItemId: refId });
            if (Number.isNaN(qty) || !ing.unit) {
              partial = true;
              issue('quantite');
              continue;
            }
            // Valeurs nutritives d'abord : un ingrédient inconnu est signalé
            // comme tel, même si sa mesure pose aussi problème.
            const nutrition = refId ? await getIngredientNutrition(refId, ing.ingredient) : null;
            if (!nutrition) {
              partial = true;
              issue('inconnu');
              continue;
            }
            const grams = gramsForQuantity(qty, ing.unit, ing.ingredient, pieceWeights.get(ing.ingredient.trim().toLowerCase()));
            if (grams === null) {
              partial = true;
              issue('poids');
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

        if (!cancelled) setResult({ totals: sum, partial, approx, anyFound, avgGi, issues });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [recipe, version]);

  return { result, loading, reload: () => setVersion((v) => v + 1) };
}
