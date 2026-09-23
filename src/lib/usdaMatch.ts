// Choix et lecture d'un résultat USDA FoodData Central — fonctions pures
// (sans réseau ni Supabase), séparées de src/api/nutrition.ts pour pouvoir
// les rejouer hors navigateur (scripts d'audit des correspondances).
import type { NutritionPer100g } from '../types';

export interface UsdaNutrient {
  nutrientName: string;
  unitName: string;
  value: number;
}

export interface UsdaFood {
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

export function parseNutrition(food: UsdaFood): NutritionPer100g {
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
    // "Sugars, total including NLEA" (Foundation) ou "Total Sugars" (SR Legacy)
    sugar_g: pick(n, (x) => /^(sugars, total|total sugars)/i.test(x.nutrientName)),
    sodium_mg: pick(n, (x) => x.nutrientName === 'Sodium, Na'),
    calcium_mg: pick(n, (x) => x.nutrientName === 'Calcium, Ca'),
    iron_mg: pick(n, (x) => x.nutrientName === 'Iron, Fe'),
    potassium_mg: pick(n, (x) => x.nutrientName === 'Potassium, K'),
    magnesium_mg: pick(n, (x) => x.nutrientName === 'Magnesium, Mg'),
    zinc_mg: pick(n, (x) => x.nutrientName === 'Zinc, Zn'),
    vitamin_a_mcg: pick(n, (x) => x.nutrientName.includes('Vitamin A, RAE')),
    vitamin_c_mg: pick(n, (x) => x.nutrientName.includes('Vitamin C')),
    // L'USDA liste aussi "..., International Units" (UI) et "..., added" (part
    // ajoutée seulement) : on vise la valeur totale dans la bonne unité.
    vitamin_d_mcg: pick(n, (x) => x.nutrientName.startsWith('Vitamin D (D2 + D3)') && x.unitName.toUpperCase() === 'UG'),
    vitamin_e_mg: pick(n, (x) => x.nutrientName === 'Vitamin E (alpha-tocopherol)'),
    vitamin_b12_mcg: pick(n, (x) => x.nutrientName === 'Vitamin B-12'),
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

/** Réponse de l'endpoint /v1/foods?format=abridged (recherche par fdcId) —
 * mêmes nutriments que la recherche, mais champs nommés autrement. */
export interface UsdaAbridgedFood {
  fdcId: number;
  description: string;
  foodNutrients: { name: string; unitName: string; amount?: number }[];
}

export function fromAbridged(food: UsdaAbridgedFood): UsdaFood {
  return {
    fdcId: food.fdcId,
    description: food.description,
    foodNutrients: (food.foodNutrients ?? [])
      .filter((n) => n.amount !== undefined)
      .map((n) => ({ nutrientName: n.name, unitName: n.unitName, value: n.amount as number })),
  };
}

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

export function pickBestFood(foods: UsdaFood[], query: string): UsdaFood | null {
  if (foods.length === 0) return null;
  // Un résultat sans calorie renseignée est inutilisable, même bien nommé —
  // on l'écarte tant qu'il reste un candidat exploitable.
  const usable = foods.filter(hasCalories);
  const pool = usable.length > 0 ? usable : foods;

  // Traduction épinglée sur la description USDA exacte (voir
  // ingredientTranslations.ts) : on prend ce résultat-là, sans heuristique.
  const exact = pool.find((f) => f.description.toLowerCase() === query.trim().toLowerCase());
  if (exact) return exact;

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
