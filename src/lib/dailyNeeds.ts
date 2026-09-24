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
  /** Acides gras essentiels — apports de référence ANSES (2011) pour l'adulte,
   * rapportés à l'objectif calorique du jour : oméga-3 = ALA 1 % de l'énergie
   * + 0,5 g d'EPA+DHA ; oméga-6 (acide linoléique) = 4 % ; oméga-9 (acide
   * oléique) = 15 à 20 %. Repères, pas des prescriptions. */
  omega3_g: number;
  omega6_g: number;
  omega9_g: number;
  omega9_max_g: number;
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

const MIN_ADULT_AGE = 18;

// ANSES : 250 mg de DHA + 250 mg d'EPA par jour, en plus de l'ALA.
const OMEGA3_EPA_DHA_G = 0.5;

/** Rapport oméga-6 / oméga-3 recommandé : moins de 5 (ANSES). */
export const OMEGA6_OMEGA3_RATIO_MAX = 5;

/** Raison pour laquelle aucun objectif chiffré n'est calculé, même avec un
 * profil complet : situations où Mifflin-St Jeor ne s'applique pas (besoins
 * fondamentalement différents, pas un simple ajustement). null sinon. */
export function targetsBlockedReason(profile: Profile | null): string | null {
  if (!profile) return null;
  if (profile.special_situation === 'enceinte' || profile.special_situation === 'allaitante') {
    return "Pendant la grossesse et l'allaitement, les besoins changent trop pour cette formule : Kaly n'affiche pas d'objectifs chiffrés. Tu peux continuer à noter tes repas ; pour des repères adaptés, parles-en à ta sage-femme, ton médecin ou un·e diététicien·ne.";
  }
  if (profile.birth_date && ageFromBirthDate(profile.birth_date) < MIN_ADULT_AGE) {
    return "Avant 18 ans, les besoins sont liés à la croissance et cette formule ne s'applique pas : Kaly n'affiche pas d'objectifs chiffrés. Pour des repères adaptés, parles-en à ton médecin ou un·e diététicien·ne.";
  }
  return null;
}

/** Alertes non bloquantes sur des valeurs de profil peu plausibles (faute de
 * frappe probable) ou un rythme de variation de poids trop rapide. */
export function profileWarnings(profile: Profile): string[] {
  const warnings: string[] = [];
  if (profile.height_cm != null && (profile.height_cm < 120 || profile.height_cm > 230)) {
    warnings.push(`Taille de ${profile.height_cm} cm : vérifie la saisie (en centimètres).`);
  }
  if (profile.weight_kg != null && (profile.weight_kg < 30 || profile.weight_kg > 250)) {
    warnings.push(`Poids de ${profile.weight_kg} kg : vérifie la saisie (en kilos).`);
  }
  if (profile.birth_date) {
    const age = ageFromBirthDate(profile.birth_date);
    if (age > 100 || age < 0) warnings.push(`Date de naissance donnant ${age} ans : vérifie la saisie.`);
  }
  if (profile.goal_weight_change_kg && profile.goal_timeframe_weeks && profile.goal_timeframe_weeks > 0) {
    const perWeek = profile.goal_weight_change_kg / profile.goal_timeframe_weeks;
    if (perWeek < -1) {
      warnings.push(
        `Rythme visé : ${Math.abs(perWeek).toFixed(1)} kg perdus par semaine. Au-delà d'environ 1 kg/semaine, la perte se fait aussi sur les muscles et se maintient mal — un rythme de 0,5 kg/semaine est plus sûr.`,
      );
    } else if (perWeek > 0.5) {
      warnings.push(
        `Rythme visé : ${perWeek.toFixed(1)} kg pris par semaine. Au-delà d'environ 0,5 kg/semaine, la prise se fait surtout en masse grasse.`,
      );
    }
  }
  return warnings;
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
 * la personne fait vraiment.
 *
 * `lutealPhaseExtraKcal` (optionnel) : besoin énergétique en plus pendant la
 * semaine précédant les règles (~100-300 kcal/jour couramment cité) — ajouté
 * à l'objectif d'apport, pas à la dépense (voir lib/cycle.ts isLutealPhase). */
export function computeDailyTargets(
  profile: Profile,
  measuredAvgActivityKcal?: number,
  lutealPhaseExtraKcal = 0,
): DailyTargets | null {
  if (!isProfileComplete(profile) || targetsBlockedReason(profile)) return null;

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

  const rawCalories = tdee + adjustment + lutealPhaseExtraKcal;
  const calories = Math.max(floor, rawCalories);

  const protein_g = profile.weight_kg * PROTEIN_G_PER_KG[profile.activity_level];
  const proteinCal = protein_g * 4;
  const fatCal = calories * 0.3;
  const fat_g = fatCal / 9;
  const carbsCal = Math.max(0, calories - proteinCal - fatCal);
  const carbs_g = carbsCal / 4;
  const fat_saturated_g = (calories * 0.1) / 9;
  const omega3_g = (calories * 0.01) / 9 + OMEGA3_EPA_DHA_G;
  const omega6_g = (calories * 0.04) / 9;
  const omega9_g = (calories * 0.15) / 9;
  const omega9_max_g = (calories * 0.2) / 9;

  return {
    calories_kcal: calories,
    protein_g,
    carbs_g,
    fat_g,
    fat_saturated_g,
    omega3_g,
    omega6_g,
    omega9_g,
    omega9_max_g,
    flooredBySafety: rawCalories < floor,
    bmr_kcal: bmr,
    tdee_kcal: tdee,
    tdeeSource,
  };
}
