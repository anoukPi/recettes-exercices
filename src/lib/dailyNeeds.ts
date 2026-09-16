import type { ActivityLevel, Goal, Profile } from '../types';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentaire: 1.2,
  leger: 1.375,
  modere: 1.55,
  actif: 1.725,
  tres_actif: 1.9,
};

// g de protéines par kg de poids corporel, selon le niveau d'activité —
// plage courante dans les recommandations sportives (ISSN, ACSM/AND/DC) :
// ~1.2g/kg pour une activité faible jusqu'à ~2g/kg pour un entraînement
// intense fréquent. Pas propre à un sport particulier — approximation
// générale par niveau d'activité déclaré.
const PROTEIN_G_PER_KG: Record<ActivityLevel, number> = {
  sedentaire: 1.2,
  leger: 1.4,
  modere: 1.6,
  actif: 1.8,
  tres_actif: 2.0,
};

// Ajustement calorique par objectif — un déficit/surplus modéré et courant
// (≈0,5 kg/semaine en perte), pas une prescription médicale.
const GOAL_ADJUSTMENT: Record<Goal, number> = {
  perte: -500,
  maintien: 0,
  prise: 400,
};

// Plancher calorique de sécurité (FR-8) : seuils couramment cités en dessous
// desquels un déficit devient un sujet à voir avec un professionnel de santé,
// pas un réglage d'app.
const CALORIE_FLOOR: Record<'homme' | 'femme', number> = {
  homme: 1500,
  femme: 1200,
};

export interface DailyTargets {
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  /** Repère indicatif (OMS/ANSES : ~10% des calories) — pas une limite stricte. */
  fat_saturated_g: number;
  flooredBySafety: boolean;
  /** Métabolisme de base — calories brûlées au repos complet, avant tout mouvement. */
  bmr_kcal: number;
  /** Dépense totale estimée — avant l'ajustement lié à l'objectif (déficit/surplus).
   * C'est la vraie estimation de "dépenses", pas l'objectif calorique d'apport. */
  tdee_kcal: number;
  /** "measured" si tdee_kcal vient des séances réellement loguées dans le carnet
   * d'activité (BMR + moyenne mesurée), "estimated" si c'est le multiplicateur
   * générique du niveau d'activité déclaré, faute d'assez de séances loguées. */
  tdeeSource: 'measured' | 'estimated';
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
 * et du sexe.
 *
 * `measuredAvgActivityKcal` (optionnel) : moyenne quotidienne des calories
 * d'activité réellement loguées sur une période récente (voir
 * useMeasuredActivity) — remplace le multiplicateur générique du niveau
 * d'activité déclaré par BMR + cette moyenne mesurée, plus fidèle à ce que
 * la personne fait vraiment. */
export function computeDailyTargets(
  profile: Profile,
  measuredAvgActivityKcal?: number,
): DailyTargets | null {
  if (!isProfileComplete(profile)) return null;

  const age = ageFromBirthDate(profile.birth_date);
  const base = 10 * profile.weight_kg + 6.25 * profile.height_cm - 5 * age;
  const bmr = profile.sex === 'homme' ? base + 5 : base - 161;
  const tdeeSource: 'measured' | 'estimated' = measuredAvgActivityKcal != null ? 'measured' : 'estimated';
  const tdee =
    measuredAvgActivityKcal != null
      ? bmr + measuredAvgActivityKcal
      : bmr * ACTIVITY_MULTIPLIERS[profile.activity_level];
  const floor = CALORIE_FLOOR[profile.sex];

  // ~7700 kcal par kg de masse (perdu ou pris) — un ordre de grandeur courant,
  // pas une constante physiologique exacte.
  const adjustment =
    profile.goal_weight_change_kg && profile.goal_timeframe_weeks
      ? (profile.goal_weight_change_kg * 7700) / (profile.goal_timeframe_weeks * 7)
      : GOAL_ADJUSTMENT[profile.goal];

  const rawCalories = tdee + adjustment;
  const calories = Math.max(floor, rawCalories);

  const protein_g = profile.weight_kg * PROTEIN_G_PER_KG[profile.activity_level];
  const proteinCal = protein_g * 4;
  const fatCal = calories * 0.3;
  const fat_g = fatCal / 9;
  const carbsCal = Math.max(0, calories - proteinCal - fatCal);
  const carbs_g = carbsCal / 4;
  const fat_saturated_g = (calories * 0.1) / 9;

  return {
    calories_kcal: calories,
    protein_g,
    carbs_g,
    fat_g,
    fat_saturated_g,
    flooredBySafety: rawCalories < floor,
    bmr_kcal: bmr,
    tdee_kcal: tdee,
    tdeeSource,
  };
}
