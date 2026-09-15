import type { ActivityLevel, Goal, Profile } from '../types';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentaire: 1.2,
  leger: 1.375,
  modere: 1.55,
  actif: 1.725,
  tres_actif: 1.9,
};

// Ajustement calorique par objectif — un déficit/surplus modéré et courant
// (≈0,5 kg/semaine en perte), pas une prescription médicale.
const GOAL_ADJUSTMENT: Record<Goal, number> = {
  perte: -500,
  maintien: 0,
  prise: 400,
};

export interface DailyTargets {
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export function ageFromBirthDate(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export function isProfileComplete(profile: Profile | null): profile is Profile & {
  sex: 'homme' | 'femme';
  birth_date: string;
  height_cm: number;
  weight_kg: number;
  activity_level: ActivityLevel;
  goal: Goal;
} {
  return !!(
    profile &&
    profile.sex &&
    profile.birth_date &&
    profile.height_cm &&
    profile.weight_kg &&
    profile.activity_level &&
    profile.goal
  );
}

/** Métabolisme de base (Mifflin-St Jeor), la formule la plus fiable et la plus
 * couramment utilisée pour l'estimer à partir du poids, de la taille, de l'âge
 * et du sexe. */
export function computeDailyTargets(profile: Profile): DailyTargets | null {
  if (!isProfileComplete(profile)) return null;

  const age = ageFromBirthDate(profile.birth_date);
  const base = 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * age;
  const bmr = profile.sex === 'homme' ? base + 5 : base - 161;
  const tdee = bmr * ACTIVITY_MULTIPLIERS[profile.activity_level];
  const calories = Math.max(1200, tdee + GOAL_ADJUSTMENT[profile.goal]);

  const protein_g = profile.weight_kg * 1.8;
  const proteinCal = protein_g * 4;
  const fatCal = calories * 0.3;
  const fat_g = fatCal / 9;
  const carbsCal = Math.max(0, calories - proteinCal - fatCal);
  const carbs_g = carbsCal / 4;

  return { calories_kcal: calories, protein_g, carbs_g, fat_g };
}
