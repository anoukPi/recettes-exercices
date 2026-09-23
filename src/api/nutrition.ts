import { supabase } from '../lib/supabaseClient';
import { lookupNutrition } from '../lib/nutritionLookup';
import type { IngredientNutrition, NutritionPer100g } from '../types';

const USDA_API_KEY = import.meta.env.VITE_USDA_API_KEY as string | undefined;

export async function getIngredientNutrition(
  referenceItemId: string,
  ingredientName: string,
): Promise<IngredientNutrition | null> {
  const { data: cached, error: cacheError } = await supabase
    .from('ingredient_nutrition')
    .select('*')
    .eq('reference_item_id', referenceItemId)
    .maybeSingle();
  if (cacheError) throw cacheError;
  if (cached) return cached;

  const found = await lookupNutrition(ingredientName, USDA_API_KEY);
  if (!found) return null;

  const { data: saved, error: saveError } = await supabase
    .from('ingredient_nutrition')
    .upsert(
      {
        reference_item_id: referenceItemId,
        source: found.source,
        fdc_id: found.fdc_id,
        fdc_description: found.fdc_description,
        ...found.values,
      },
      { onConflict: 'reference_item_id' },
    )
    .select()
    .single();
  if (saveError) throw saveError;
  return saved;
}

/** Saisie manuelle (ex: valeurs demandées par l'utilisatrice à une IA en
 * dehors de l'app) quand rien n'a été trouvé dans USDA. Remplace le cache
 * existant pour cet ingrédient de référence — même mécanisme que le cache
 * USDA, juste marqué source: 'manual' pour rester traçable dans l'UI. */
export async function setManualNutrition(
  referenceItemId: string,
  values: Partial<NutritionPer100g>,
): Promise<IngredientNutrition> {
  const { data, error } = await supabase
    .from('ingredient_nutrition')
    .upsert(
      {
        reference_item_id: referenceItemId,
        fdc_id: null,
        fdc_description: null,
        source: 'manual',
        ...values,
      },
      { onConflict: 'reference_item_id' },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}
