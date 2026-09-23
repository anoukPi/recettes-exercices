import { getIngredientNutrition } from './nutrition';
import { listReferenceItems } from './referenceItems';
import { INGREDIENT_FDC_ID } from '../lib/ingredientPins';
import { INGREDIENT_EN } from '../lib/ingredientTranslations';
import { REFERENCE_NUTRITION } from '../lib/referenceNutrition';
import { hasNutritionSource, lookupNutrition, searchUsdaCandidates } from '../lib/nutritionLookup';
import type { NutritionPer100g } from '../types';

const USDA_API_KEY = import.meta.env.VITE_USDA_API_KEY as string | undefined;

export interface ComparableFood {
  /** Clé stable : nom en minuscules, ou "usda:<fdcId>" pour une fiche testée directement. */
  key: string;
  name: string;
  /** Présent si l'aliment existe dans la liste d'ingrédients (valeurs mises en cache). */
  referenceItemId: string | null;
}

export interface FoodValues {
  values: NutritionPer100g;
  sourceLabel: string | null;
}

/** Sans accents ni majuscules — "farine de ble" doit trouver "farine de blé". */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** true si un mot du nom commence par la recherche — « riz » trouve « farine
 * de riz » mais pas « chorizo ». */
export function matchesSearch(name: string, normalizedQuery: string): boolean {
  const normalizedName = normalizeForSearch(name);
  return normalizedName.split(' ').some((_, i, words) => words.slice(i).join(' ').startsWith(normalizedQuery));
}

/** Tous les aliments pour lesquels Kaly sait trouver des valeurs : la liste
 * d'ingrédients + les noms connus des tables de correspondance (épinglés,
 * références françaises, traductions), dédoublonnés. */
export async function listComparableFoods(): Promise<ComparableFood[]> {
  const items = await listReferenceItems('ingredient');
  const byKey = new Map<string, ComparableFood>();
  for (const item of items) {
    const key = item.name.trim().toLowerCase();
    if (!byKey.has(key)) byKey.set(key, { key, name: item.name.trim(), referenceItemId: item.id });
  }
  const knownNames = [
    ...Object.keys(INGREDIENT_FDC_ID),
    ...Object.keys(REFERENCE_NUTRITION),
    ...Object.keys(INGREDIENT_EN),
  ];
  for (const name of knownNames) {
    if (!byKey.has(name)) {
      byKey.set(name, { key: name, name: name.charAt(0).toUpperCase() + name.slice(1), referenceItemId: null });
    }
  }
  return [...byKey.values()]
    .filter((f) => f.referenceItemId !== null || hasNutritionSource(f.name))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

const memo = new Map<string, Promise<FoodValues | null>>();

/** Valeurs pour 100 g. Ingrédient de la liste : passe par le cache habituel
 * (et le remplit). Nom seulement connu des tables : calcul à la volée, sans
 * rien ajouter à la liste d'ingrédients. */
export function valuesForFood(food: ComparableFood): Promise<FoodValues | null> {
  const cached = memo.get(food.key);
  if (cached) return cached;
  const promise = (async (): Promise<FoodValues | null> => {
    if (food.referenceItemId) {
      const n = await getIngredientNutrition(food.referenceItemId, food.name);
      return n ? { values: n, sourceLabel: n.fdc_description } : null;
    }
    const found = await lookupNutrition(food.name, USDA_API_KEY);
    return found ? { values: found.values, sourceLabel: found.fdc_description } : null;
  })();
  // Une erreur (réseau, USDA) ne doit pas rester mémorisée : on pourra réessayer.
  promise.catch(() => memo.delete(food.key));
  memo.set(food.key, promise);
  return promise;
}

export function searchUsda(query: string) {
  return searchUsdaCandidates(query, USDA_API_KEY);
}
