// Résolution nom d'ingrédient → valeurs nutritionnelles pour 100 g, sans
// Supabase : partagé entre l'app (src/api/nutrition.ts) et le script de
// recalcul du cache (scripts/refresh-nutrition.mjs).
//
// Ordre de priorité :
//   1. valeur de référence française (referenceNutrition.ts)
//   2. fiche USDA épinglée par fdcId (ingredientPins.ts)
//   3. recherche USDA texte via la traduction anglaise (ingredientTranslations.ts)
// Sans aucune de ces trois sources : null (pas de recherche sur le nom
// français, qui renvoyait un aliment arbitraire, ex: "Dulce de Leche").
import { INGREDIENT_FDC_ID } from './ingredientPins';
import { INGREDIENT_EN } from './ingredientTranslations';
import { referenceNutritionFor } from './referenceNutrition';
import { fromAbridged, parseNutrition, pickBestFood, type UsdaAbridgedFood, type UsdaFood } from './usdaMatch';
import type { NutritionPer100g } from '../types';

const API = 'https://api.nal.usda.gov/fdc/v1';

export interface NutritionLookup {
  source: 'usda' | 'manual';
  fdc_id: number | null;
  fdc_description: string | null;
  values: NutritionPer100g;
}

const NUTRIENT_KEYS: (keyof NutritionPer100g)[] = [
  'calories_kcal', 'protein_g', 'carbs_g', 'fat_g', 'fat_saturated_g', 'fat_monounsaturated_g',
  'fat_polyunsaturated_g', 'fiber_g', 'sugar_g', 'sodium_mg', 'calcium_mg', 'iron_mg', 'potassium_mg',
  'magnesium_mg', 'zinc_mg', 'vitamin_a_mcg', 'vitamin_c_mg', 'vitamin_d_mcg', 'vitamin_e_mg',
  'vitamin_b12_mcg', 'omega3_g',
];

function fillNulls(values: Partial<NutritionPer100g>): NutritionPer100g {
  const full = {} as NutritionPer100g;
  for (const key of NUTRIENT_KEYS) full[key] = values[key] ?? null;
  return full;
}

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

/** true si l'ingrédient a une source nutritionnelle connue (référence,
 * fiche épinglée ou traduction) — sinon rien ne sera calculé pour lui. */
export function hasNutritionSource(name: string): boolean {
  const key = normalize(name);
  return referenceNutritionFor(key) !== null || key in INGREDIENT_FDC_ID || key in INGREDIENT_EN;
}

async function fetchJson(url: string): Promise<unknown> {
  let res = await fetch(url);
  // L'API USDA renvoie parfois une page d'erreur HTML transitoire : un seul nouvel essai.
  if (!res.ok) res = await fetch(url);
  if (!res.ok) throw new Error(`Erreur USDA (${res.status})`);
  return res.json();
}

async function fetchUsdaById(fdcId: number, apiKey: string): Promise<UsdaFood | null> {
  const data = (await fetchJson(
    `${API}/foods?fdcIds=${fdcId}&format=abridged&api_key=${encodeURIComponent(apiKey)}`,
  )) as UsdaAbridgedFood[];
  return data[0] ? fromAbridged(data[0]) : null;
}

async function searchUsda(query: string, apiKey: string): Promise<UsdaFood | null> {
  const data = (await fetchJson(
    `${API}/foods/search?api_key=${encodeURIComponent(apiKey)}` +
      `&query=${encodeURIComponent(query)}&pageSize=10&dataType=Foundation,SR%20Legacy`,
  )) as { foods?: UsdaFood[] };
  return pickBestFood(data.foods ?? [], query);
}

export async function lookupNutrition(name: string, apiKey: string | undefined): Promise<NutritionLookup | null> {
  const key = normalize(name);

  const reference = referenceNutritionFor(key);
  if (reference) {
    return { source: 'manual', fdc_id: null, fdc_description: reference.label, values: fillNulls(reference.values) };
  }

  const pinned = INGREDIENT_FDC_ID[key];
  const query = INGREDIENT_EN[key];
  if (pinned === undefined && query === undefined) return null;

  if (!apiKey) {
    throw new Error(
      'Clé USDA manquante. Ajoute VITE_USDA_API_KEY dans .env.local pour activer le calcul nutritionnel.',
    );
  }
  const food = pinned !== undefined ? await fetchUsdaById(pinned, apiKey) : await searchUsda(query, apiKey);
  if (!food) return null;
  return { source: 'usda', fdc_id: food.fdcId, fdc_description: food.description, values: parseNutrition(food) };
}
