import type { NutritionPer100g, NutritionTotals } from '../types';

// Champs présents dans les données USDA (par 100g), scalables directement.
const PER100G_KEYS: (keyof NutritionPer100g)[] = [
  'calories_kcal',
  'protein_g',
  'carbs_g',
  'fat_g',
  'fiber_g',
  'sugar_g',
  'sodium_mg',
  'calcium_mg',
  'iron_mg',
  'potassium_mg',
  'magnesium_mg',
  'zinc_mg',
  'vitamin_a_mcg',
  'vitamin_c_mg',
  'vitamin_d_mcg',
  'vitamin_e_mg',
  'vitamin_b12_mcg',
];

// Tous les champs d'un total agrégé, y compris ceux calculés à part (charge
// glycémique — pas une donnée USDA, dérivée séparément des glucides + IG).
const TOTALS_KEYS: (keyof NutritionTotals)[] = [...PER100G_KEYS, 'glycemic_load'];

export function emptyTotals(): NutritionTotals {
  const totals = {} as NutritionTotals;
  for (const key of TOTALS_KEYS) totals[key] = 0;
  return totals;
}

/** Scales per-100g nutrition to a given gram amount. Returns null if the base
 * nutrition data is unknown (calories missing = no usable data at all).
 * glycemic_load n'est pas rempli ici — voir src/lib/glycemicIndex.ts. */
export function scaleNutrition(per100g: NutritionPer100g, grams: number): NutritionTotals | null {
  if (per100g.calories_kcal === null) return null;
  const factor = grams / 100;
  const result = emptyTotals();
  for (const key of PER100G_KEYS) {
    const value = per100g[key];
    result[key] = value === null ? 0 : value * factor;
  }
  return result;
}

export function addTotals(a: NutritionTotals, b: NutritionTotals): NutritionTotals {
  const result = emptyTotals();
  for (const key of TOTALS_KEYS) result[key] = a[key] + b[key];
  return result;
}
