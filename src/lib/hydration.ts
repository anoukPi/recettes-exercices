import { ageFromBirthDate, type DailyTargets } from './dailyNeeds';
import type { BeverageType, Profile } from '../types';

export const WATER_GLASS_ML = 250;
export const TASSE_ML = 150;
export const LITRE_ML = 1000;
export type BeverageUnit = 'tasse' | 'litre';
export const BEVERAGE_UNITS_BY_TYPE: Record<BeverageType, BeverageUnit[]> = {
  eau: ['tasse', 'litre'],
  café: ['tasse'],
  thé: ['tasse', 'litre'],
  tisane: ['tasse', 'litre'],
};

// Repère courant en nutrition clinique : ~1 mL d'eau par kcal dépensée —
// englobe naturellement âge, taille, sexe, poids (via le BMR) et niveau
// d'activité (via la dépense totale), plutôt qu'un simple ratio au poids.
// Plancher de sécurité si le profil est incomplet.
const ML_PER_KCAL = 1;
const WATER_TARGET_FLOOR_ML = 1500;

/** Âge si moins de 18 ans (profil d'enfant), sinon null. */
export function childAge(profile: Profile | null): number | null {
  if (!profile?.birth_date) return null;
  const age = ageFromBirthDate(profile.birth_date);
  return age < 18 ? age : null;
}

// Repère de boissons pour un enfant (EFSA, eau totale × ~0,8 venant des
// boissons, arrondi) — pas de calcul par le poids ou les calories.
export function childWaterTarget(age: number): number {
  if (age < 9) return 1200;
  if (age < 14) return 1500;
  return 1800;
}

// OMS : au moins 60 minutes par jour d'activité modérée à soutenue (5-17 ans).
export const CHILD_ACTIVITY_MINUTES = 60;

export function waterTarget(profile: Profile | null, dailyTargets: DailyTargets | null): number {
  const age = childAge(profile);
  if (age !== null) return childWaterTarget(age);
  if (dailyTargets) {
    return Math.max(WATER_TARGET_FLOOR_ML, Math.round(dailyTargets.tdee_kcal * ML_PER_KCAL));
  }
  return profile?.weight_kg ? Math.round(profile.weight_kg * 30) : 2000;
}

