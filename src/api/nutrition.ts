import { supabase } from '../lib/supabaseClient';
import { toSearchQuery } from '../lib/ingredientTranslations';
import type { IngredientNutrition, NutritionPer100g } from '../types';

const USDA_API_KEY = import.meta.env.VITE_USDA_API_KEY as string | undefined;
const SEARCH_URL = 'https://api.nal.usda.gov/fdc/v1/foods/search';

interface UsdaNutrient {
  nutrientName: string;
  unitName: string;
  value: number;
}

interface UsdaFood {
  fdcId: number;
  description: string;
  foodNutrients: UsdaNutrient[];
}

function pick(nutrients: UsdaNutrient[], match: (n: UsdaNutrient) => boolean): number | null {
  const found = nutrients.find(match);
  return found ? found.value : null;
}

// Oméga-3 = somme des acides gras individuels que l'USDA rapporte séparément
// (ALA/EPA/DHA) — souvent absents des fiches USDA "de base" (Foundation/SR
// Legacy n'ont pas toujours le détail), d'où null pour beaucoup d'aliments
// plutôt qu'une estimation inventée.
const OMEGA3_PATTERNS = [/18:3 n-3/i, /20:5 n-3/i, /22:6 n-3/i];

function pickOmega3(nutrients: UsdaNutrient[]): number | null {
  const matches = nutrients.filter((n) => OMEGA3_PATTERNS.some((p) => p.test(n.nutrientName)));
  if (matches.length === 0) return null;
  return matches.reduce((sum, n) => sum + n.value, 0);
}

function parseNutrition(food: UsdaFood): NutritionPer100g {
  const n = food.foodNutrients ?? [];
  return {
    calories_kcal: pick(n, (x) => x.nutrientName === 'Energy' && x.unitName === 'KCAL'),
    protein_g: pick(n, (x) => x.nutrientName.startsWith('Protein')),
    carbs_g: pick(n, (x) => x.nutrientName.startsWith('Carbohydrate, by difference')),
    fat_g: pick(n, (x) => x.nutrientName === 'Total lipid (fat)'),
    fat_saturated_g: pick(n, (x) => x.nutrientName.startsWith('Fatty acids, total saturated')),
    fat_monounsaturated_g: pick(n, (x) => x.nutrientName.startsWith('Fatty acids, total monounsaturated')),
    fat_polyunsaturated_g: pick(n, (x) => x.nutrientName.startsWith('Fatty acids, total polyunsaturated')),
    fiber_g: pick(n, (x) => x.nutrientName.startsWith('Fiber, total dietary')),
    sugar_g: pick(n, (x) => x.nutrientName.toLowerCase().includes('sugars, total')),
    sodium_mg: pick(n, (x) => x.nutrientName === 'Sodium, Na'),
    calcium_mg: pick(n, (x) => x.nutrientName === 'Calcium, Ca'),
    iron_mg: pick(n, (x) => x.nutrientName === 'Iron, Fe'),
    potassium_mg: pick(n, (x) => x.nutrientName === 'Potassium, K'),
    magnesium_mg: pick(n, (x) => x.nutrientName === 'Magnesium, Mg'),
    zinc_mg: pick(n, (x) => x.nutrientName === 'Zinc, Zn'),
    vitamin_a_mcg: pick(n, (x) => x.nutrientName.includes('Vitamin A, RAE')),
    vitamin_c_mg: pick(n, (x) => x.nutrientName.includes('Vitamin C')),
    vitamin_d_mcg: pick(n, (x) => x.nutrientName.startsWith('Vitamin D')),
    vitamin_e_mg: pick(n, (x) => x.nutrientName.includes('Vitamin E')),
    vitamin_b12_mcg: pick(n, (x) => x.nutrientName.includes('Vitamin B-12')),
    omega3_g: pickOmega3(n),
  };
}

// Mots qui trahissent une forme transformée/dérivée, un produit de marque ou un
// plat préparé — pas ce qu'on veut par défaut quand quelqu'un ajoute "banane" ou
// "poulet". Ignorés s'ils font partie de la recherche elle-même (ex: "huile d'olive").
const PENALIZED_WORDS = [
  'powder', 'dehydrated', 'dried', 'juice', 'candied', 'chips', 'flakes', 'extract',
  'frozen', 'canned', 'sugared', 'pasteurized', 'imitation', 'substitute', 'concentrate',
  'spread', 'meatless', 'cookie', 'wafer', 'syrup', 'babyfood', 'snack', 'boiled', 'feet',
  'giblets', 'candies', 'bar', 'cracker', 'restaurant', 'fast foods', 'soup', 'oil',
  ' mix', 'unprepared', 'breaded', 'tenders', 'lunchmeat', 'roll', 'deli', 'seasoned',
  'glazed', 'rotisserie', 'prepackaged', 'fat free', 'fat-free', 'luncheon', 'white', 'yolk',
  'bagels', 'bread', 'crackers', 'substitute', 'topping', 'muffin', 'toaster', 'pancake', 'baked',
];

function hasCalories(food: UsdaFood): boolean {
  return (food.foodNutrients ?? []).some((n) => n.nutrientName === 'Energy' && n.unitName === 'KCAL');
}

function hasBrandMarker(description: string): boolean {
  // Les vraies entrées de marque USDA mettent la marque avant la première
  // virgule (ex: "TACO BELL, Nachos") — on ignore le reste pour éviter de
  // pénaliser à tort des sigles légitimes dans une note entre parenthèses
  // (ex: "... (Includes foods for USDA's Food Distribution Program)").
  const prefix = description.split(',')[0];
  return /\b[A-Z]{2,}\b/.test(prefix);
}

/** Formes plurielles/singulières plausibles d'un mot anglais simple — pour que
 * "strawberry" matche "strawberries", "cherry" matche "cherries", etc. */
function wordVariants(word: string): string[] {
  const variants = new Set([word]);
  if (word.endsWith('y') && !/[aeiou]y$/.test(word)) {
    variants.add(`${word.slice(0, -1)}ies`);
  } else {
    variants.add(`${word}s`);
  }
  if (word.endsWith('s')) variants.add(word.slice(0, -1));
  if (word.endsWith('ies')) variants.add(`${word.slice(0, -3)}y`);
  return [...variants];
}

function scoreFood(description: string, queryWords: string[]): number {
  const lower = description.toLowerCase();
  const tokens = lower.split(/[ ,()]+/).filter(Boolean);
  let score = 0;

  for (const word of queryWords) {
    if (wordVariants(word).some((variant) => tokens.includes(variant))) score += 8;
  }

  const firstToken = tokens[0] ?? '';
  const firstQueryWord = queryWords[0] ?? '';
  if (wordVariants(firstQueryWord).includes(firstToken)) {
    score += 5;
  }

  for (const word of PENALIZED_WORDS) {
    if (!queryWords.includes(word) && lower.includes(word)) score -= 6;
  }
  if (hasBrandMarker(description)) score -= 20;
  if (/\braw\b/.test(lower)) score += 4;
  score -= (lower.match(/,/g)?.length ?? 0) * 0.3;

  return score;
}

function pickBestFood(foods: UsdaFood[], query: string): UsdaFood | null {
  if (foods.length === 0) return null;
  // Un résultat sans calorie renseignée est inutilisable, même bien nommé —
  // on l'écarte tant qu'il reste un candidat exploitable.
  const usable = foods.filter(hasCalories);
  const pool = usable.length > 0 ? usable : foods;

  const queryWords = query.trim().toLowerCase().split(' ');
  let best = pool[0];
  let bestScore = scoreFood(best.description, queryWords);
  for (const food of pool.slice(1)) {
    const score = scoreFood(food.description, queryWords);
    if (score > bestScore) {
      best = food;
      bestScore = score;
    }
  }
  return best;
}

async function searchUsda(query: string): Promise<UsdaFood | null> {
  if (!USDA_API_KEY) {
    throw new Error(
      "Clé USDA manquante. Ajoute VITE_USDA_API_KEY dans .env.local pour activer le calcul nutritionnel.",
    );
  }
  const url =
    `${SEARCH_URL}?api_key=${encodeURIComponent(USDA_API_KEY)}` +
    `&query=${encodeURIComponent(query)}&pageSize=10&dataType=Foundation,SR%20Legacy`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erreur USDA (${res.status})`);
  const data = await res.json();
  const foods: UsdaFood[] = data.foods ?? [];
  return pickBestFood(foods, query);
}

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

  const food = await searchUsda(toSearchQuery(ingredientName));
  if (!food) return null;

  const parsed = parseNutrition(food);
  const { data: saved, error: saveError } = await supabase
    .from('ingredient_nutrition')
    .upsert(
      {
        reference_item_id: referenceItemId,
        fdc_id: food.fdcId,
        fdc_description: food.description,
        ...parsed,
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
