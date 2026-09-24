import { supabase } from '../lib/supabaseClient';
import { getIngredientNutrition } from './nutrition';
import { listReferenceItems } from './referenceItems';
import { INGREDIENT_FDC_ID } from '../lib/ingredientPins';
import { INGREDIENT_EN } from '../lib/ingredientTranslations';
import { REFERENCE_NUTRITION } from '../lib/referenceNutrition';
import { hasNutritionSource, lookupNutrition, searchUsdaCandidates } from '../lib/nutritionLookup';
import type { IngredientNutrition, NutritionPer100g } from '../types';

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

// Valeurs déjà calculées pendant la session, par clé d'aliment.
const memo = new Map<string, Promise<FoodValues | null>>();

/** Sans accents ni majuscules — "farine de ble" doit trouver "farine de blé". */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
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
  const [items, cachedRows] = await Promise.all([
    listReferenceItems('ingredient'),
    // Toutes les valeurs déjà en cache d'un coup, plutôt qu'une requête par aliment.
    supabase.from('ingredient_nutrition').select('*'),
  ]);
  const cacheByRefId = new Map(((cachedRows.data ?? []) as IngredientNutrition[]).map((n) => [n.reference_item_id, n]));

  // Clé de dédoublonnage : « Bœuf haché light » et « boeuf haché light » sont le même aliment.
  const byKey = new Map<string, ComparableFood>();
  for (const item of items) {
    const key = normalizeForSearch(item.name);
    if (byKey.has(key)) continue;
    const food = { key, name: item.name.trim(), referenceItemId: item.id };
    byKey.set(key, food);
    const cached = cacheByRefId.get(item.id);
    if (cached && !memo.has(key)) memo.set(key, Promise.resolve({ values: cached, sourceLabel: cached.fdc_description }));
  }
  const knownNames = [
    ...Object.keys(INGREDIENT_FDC_ID),
    ...Object.keys(REFERENCE_NUTRITION),
    ...Object.keys(INGREDIENT_EN),
  ];
  for (const name of knownNames) {
    const key = normalizeForSearch(name);
    if (!byKey.has(key)) {
      byKey.set(key, { key, name: name.charAt(0).toUpperCase() + name.slice(1), referenceItemId: null });
    }
  }
  return [...byKey.values()]
    .filter((f) => f.referenceItemId !== null || hasNutritionSource(f.name))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}


// Une catégorie entière peut demander plus de 100 aliments : on limite le
// nombre d'appels simultanés (USDA et Supabase) pour ne pas tout lancer d'un coup.
const MAX_IN_FLIGHT = 8;
let inFlight = 0;
const waiting: (() => void)[] = [];

async function limited<T>(task: () => Promise<T>): Promise<T> {
  if (inFlight >= MAX_IN_FLIGHT) await new Promise<void>((resolve) => waiting.push(resolve));
  inFlight++;
  try {
    return await task();
  } finally {
    inFlight--;
    waiting.shift()?.();
  }
}

// Cache navigateur des aliments calculés à la volée (hors liste d'ingrédients,
// donc sans cache Supabase) — évite de refaire les appels USDA à chaque visite.
// Préfixe versionné : à incrémenter si la logique de calcul change.
const LOCAL_CACHE_PREFIX = 'kaly-compare-v3:';
const LOCAL_CACHE_TTL_MS = 30 * 24 * 3600 * 1000;

function readLocal(key: string): FoodValues | null | undefined {
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_PREFIX + key);
    if (!raw) return undefined;
    const { at, data } = JSON.parse(raw) as { at: number; data: FoodValues | null };
    return Date.now() - at < LOCAL_CACHE_TTL_MS ? data : undefined;
  } catch {
    return undefined;
  }
}

function writeLocal(key: string, data: FoodValues | null) {
  try {
    localStorage.setItem(LOCAL_CACHE_PREFIX + key, JSON.stringify({ at: Date.now(), data }));
  } catch {
    // Stockage indisponible (navigation privée, quota) : on s'en passe.
  }
}

/** Valeurs pour 100 g. Ingrédient de la liste : passe par le cache habituel
 * (et le remplit). Nom seulement connu des tables : calcul à la volée, sans
 * rien ajouter à la liste d'ingrédients. */
export function valuesForFood(food: ComparableFood): Promise<FoodValues | null> {
  const cached = memo.get(food.key);
  if (cached) return cached;
  const promise = limited(async (): Promise<FoodValues | null> => {
    if (food.referenceItemId) {
      const n = await getIngredientNutrition(food.referenceItemId, food.name);
      return n ? { values: n, sourceLabel: n.fdc_description } : null;
    }
    const local = readLocal(food.key);
    if (local !== undefined) return local;
    const found = await lookupNutrition(food.name, USDA_API_KEY);
    const result = found ? { values: found.values, sourceLabel: found.fdc_description } : null;
    writeLocal(food.key, result);
    return result;
  });
  // Une erreur (réseau, USDA) ne doit pas rester mémorisée : on pourra réessayer.
  promise.catch(() => memo.delete(food.key));
  memo.set(food.key, promise);
  return promise;
}

export function searchUsda(query: string) {
  return searchUsdaCandidates(query, USDA_API_KEY);
}

/** Traduction français → anglais pour la recherche USDA : d'abord le
 * dictionnaire vérifié de Kaly, sinon le service gratuit MyMemory (ne reçoit
 * que le nom de l'aliment). La traduction reste à vérifier par l'utilisatrice. */
export async function translateToEnglish(french: string): Promise<{ text: string; source: 'kaly' | 'mymemory' }> {
  const known = INGREDIENT_EN[french.trim().toLowerCase()];
  if (known) return { text: known, source: 'kaly' };
  const res = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(french.trim())}&langpair=fr|en`,
  );
  if (!res.ok) throw new Error(`Traduction indisponible (${res.status})`);
  const data = (await res.json()) as { responseData?: { translatedText?: string }; quotaFinished?: boolean };
  const text = data.responseData?.translatedText?.trim();
  if (!text || data.quotaFinished) throw new Error('Traduction indisponible pour le moment.');
  return { text: text.toLowerCase(), source: 'mymemory' };
}
