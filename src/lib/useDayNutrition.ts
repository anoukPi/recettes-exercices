import { useEffect, useMemo, useState } from 'react';
import { addTotals, emptyTotals, scaleNutrition } from './nutritionCalc';
import { gramsForQuantity, isApproxUnit } from './unitConversion';
import { hasKnownTranslation } from './ingredientTranslations';
import { giFor } from './glycemicIndex';
import { computeDailyTargets, type DailyTargets } from './dailyNeeds';
import { listJournalEntries } from '../api/journal';
import { getIngredientNutrition } from '../api/nutrition';
import { listReferenceItems } from '../api/referenceItems';
import { getRecipe } from '../api/recipes';
import { getProfile } from '../api/profile';
import { listActivityEntries } from '../api/activities';
import { MEALS, type ActivityEntry, type JournalEntry, type NutritionTotals, type Profile } from '../types';

export const REASON_APPROX_UNIT = 'mesure convertie par une moyenne approximative (ex: 1 càs ≈ 15g), pas la densité réelle de cet ingrédient';
export const REASON_UNKNOWN_TRANSLATION = "ingrédient sans traduction connue — la recherche dans la base USDA s'est faite avec le nom français tel quel, résultat non garanti";
export const REASON_PARTIAL_RECIPE = "certains ingrédients de la recette n'ont pas pu être calculés (mesure non convertible ou ingrédient introuvable) et sont exclus du total";
export const REASON_UNAVAILABLE = 'mesure non convertible en grammes, ou ingrédient introuvable dans la base USDA — aucune valeur calculable';
export const REASON_UNKNOWN_GI = "indice glycémique inconnu pour cet ingrédient — non compté dans la charge glycémique du jour";

export type EntryNutritionState =
  | { status: 'loading' }
  | {
      status: 'ok';
      totals: NutritionTotals;
      partial: boolean;
      warnings: string[];
      grams: number | null;
      gi: number | null;
    }
  | { status: 'unavailable' };

export function useDayNutrition(dateKey: string) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activityEntries, setActivityEntries] = useState<ActivityEntry[]>([]);
  const [nutritionByEntry, setNutritionByEntry] = useState<Record<string, EntryNutritionState>>({});
  const [ingredientNameToId, setIngredientNameToId] = useState<Map<string, string>>(new Map());
  const [pieceWeights, setPieceWeights] = useState<Map<string, number>>(new Map());

  const loadEntries = (date: string) => {
    setLoading(true);
    listJournalEntries(date)
      .then(setEntries)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erreur de chargement.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEntries(dateKey);
    listActivityEntries(dateKey).then(setActivityEntries).catch(() => setActivityEntries([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey]);

  useEffect(() => {
    getProfile().then(setProfile).catch(() => {});
    listReferenceItems('ingredient')
      .then((items) => {
        const map = new Map<string, string>();
        const weights = new Map<string, number>();
        for (const item of items) {
          map.set(item.name.toLowerCase(), item.id);
          if (item.piece_weight_g != null) weights.set(item.name.toLowerCase(), item.piece_weight_g);
        }
        setIngredientNameToId(map);
        setPieceWeights(weights);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    entries.forEach((entry) => {
      setNutritionByEntry((prev) => ({ ...prev, [entry.id]: { status: 'loading' } }));

      const compute = async (): Promise<EntryNutritionState> => {
        if (entry.kind === 'ingredient') {
          if (!entry.reference_item_id || !entry.unit) return { status: 'unavailable' };
          const grams = gramsForQuantity(
            entry.quantity,
            entry.unit,
            entry.label,
            pieceWeights.get(entry.label.trim().toLowerCase()),
          );
          if (grams === null) return { status: 'unavailable' };
          const nutrition = await getIngredientNutrition(entry.reference_item_id, entry.label);
          if (!nutrition) return { status: 'unavailable' };
          const totals = scaleNutrition(nutrition, grams);
          if (!totals) return { status: 'unavailable' };
          const warnings: string[] = [];
          if (isApproxUnit(entry.unit)) warnings.push(REASON_APPROX_UNIT);
          if (!hasKnownTranslation(entry.label)) warnings.push(REASON_UNKNOWN_TRANSLATION);
          const gi = giFor(entry.label);
          if (gi !== null) {
            totals.glycemic_load = (gi * totals.carbs_g) / 100;
          } else if (totals.carbs_g >= 1) {
            warnings.push(REASON_UNKNOWN_GI);
          }
          return { status: 'ok', totals, partial: false, warnings, grams, gi };
        }

        if (!entry.recipe_id) return { status: 'unavailable' };
        const recipe = await getRecipe(entry.recipe_id);
        let sum = emptyTotals();
        let anyFound = false;
        let partial = false;
        let anyApproxUnit = false;
        let anyUnknownTranslation = false;
        let anyUnknownGI = false;

        for (const ing of recipe.ingredients) {
          const qty = parseFloat(ing.quantity.replace(',', '.'));
          const refId = ingredientNameToId.get(ing.ingredient.trim().toLowerCase());
          if (!refId || Number.isNaN(qty) || !ing.unit) {
            partial = true;
            continue;
          }
          const grams = gramsForQuantity(
            qty,
            ing.unit,
            ing.ingredient,
            pieceWeights.get(ing.ingredient.trim().toLowerCase()),
          );
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
          if (gi !== null) {
            scaled.glycemic_load = (gi * scaled.carbs_g) / 100;
          } else if (scaled.carbs_g >= 1) {
            anyUnknownGI = true;
          }
          sum = addTotals(sum, scaled);
          anyFound = true;
          if (isApproxUnit(ing.unit)) anyApproxUnit = true;
          if (!hasKnownTranslation(ing.ingredient)) anyUnknownTranslation = true;
        }

        if (!anyFound) return { status: 'unavailable' };
        const factor = entry.quantity;
        const scaledSum = emptyTotals();
        for (const key of Object.keys(sum) as (keyof NutritionTotals)[]) {
          scaledSum[key] = sum[key] * factor;
        }
        const warnings: string[] = [];
        if (partial) warnings.push(REASON_PARTIAL_RECIPE);
        if (anyApproxUnit) warnings.push(REASON_APPROX_UNIT);
        if (anyUnknownTranslation) warnings.push(REASON_UNKNOWN_TRANSLATION);
        if (anyUnknownGI) warnings.push(REASON_UNKNOWN_GI);
        return { status: 'ok', totals: scaledSum, partial, warnings, grams: null, gi: null };
      };

      compute()
        .then((result) => {
          if (!cancelled) setNutritionByEntry((prev) => ({ ...prev, [entry.id]: result }));
        })
        .catch(() => {
          if (!cancelled) setNutritionByEntry((prev) => ({ ...prev, [entry.id]: { status: 'unavailable' } }));
        });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, ingredientNameToId, pieceWeights]);

  const dayTotals = useMemo(() => {
    let totals = emptyTotals();
    let hasAny = false;
    let hasPartial = false;
    let hasWarning = false;
    for (const entry of entries) {
      const state = nutritionByEntry[entry.id];
      if (state?.status === 'ok') {
        totals = addTotals(totals, state.totals);
        hasAny = true;
        if (state.partial) hasPartial = true;
        if (state.warnings.length > 0) hasWarning = true;
      } else {
        hasPartial = true;
      }
    }
    return { totals, hasAny, hasPartial, hasWarning };
  }, [entries, nutritionByEntry]);

  const dayActivityCalories = useMemo(
    () => activityEntries.reduce((sum, a) => sum + a.calories_kcal, 0),
    [activityEntries],
  );

  // Journée avec activité loguée : BMR (dépense de base, incompressible) +
  // l'activité réellement mesurée ce jour-là — plus précis que le
  // multiplicateur générique du profil, et fait varier calories ET macros
  // ensemble (une grosse séance ce jour-là relève tous les objectifs du
  // jour, pas seulement l'écart calorique). Sans activité loguée : on
  // retombe sur l'estimation générale du profil.
  const dailyTargets: DailyTargets | null = useMemo(
    () =>
      profile
        ? computeDailyTargets(profile, activityEntries.length > 0 ? dayActivityCalories : undefined)
        : null,
    [profile, activityEntries.length, dayActivityCalories],
  );

  const bilan = useMemo(() => {
    if (!dailyTargets) return null;
    return {
      expenses: dailyTargets.tdee_kcal,
      measured: dailyTargets.tdeeSource === 'measured',
      bmr: dailyTargets.bmr_kcal,
      activityCalories: dayActivityCalories,
      gap: dayTotals.totals.calories_kcal - dailyTargets.tdee_kcal,
    };
  }, [dailyTargets, dayActivityCalories, dayTotals.totals.calories_kcal]);

  const dayGi = useMemo(() => {
    if (dayTotals.totals.carbs_g < 1) return null;
    return (dayTotals.totals.glycemic_load / dayTotals.totals.carbs_g) * 100;
  }, [dayTotals]);

  const entriesByMeal = useMemo(() => {
    const groups = new Map<string, JournalEntry[]>();
    for (const entry of entries) {
      const list = groups.get(entry.meal) ?? [];
      list.push(entry);
      groups.set(entry.meal, list);
    }
    const orderedMeals = [...MEALS, ...[...groups.keys()].filter((m) => !(MEALS as readonly string[]).includes(m))];
    return orderedMeals
      .filter((meal) => groups.has(meal))
      .map((meal) => {
        const mealEntries = groups.get(meal)!;
        let mealTotals = emptyTotals();
        for (const entry of mealEntries) {
          const state = nutritionByEntry[entry.id];
          if (state?.status === 'ok') mealTotals = addTotals(mealTotals, state.totals);
        }
        return { meal, entries: mealEntries, totals: mealTotals };
      });
  }, [entries, nutritionByEntry]);

  return {
    entries,
    setEntries,
    loading,
    error,
    reload: () => loadEntries(dateKey),
    profile,
    dailyTargets,
    activityEntries,
    dayActivityCalories,
    bilan,
    nutritionByEntry,
    dayTotals,
    dayGi,
    entriesByMeal,
  };
}
