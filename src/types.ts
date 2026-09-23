export interface RecipeIngredient {
  quantity: string;
  unit: string;
  ingredient: string;
}

export interface Recipe {
  id: string;
  /** null = autrice qui a supprimé son compte : la recette reste dans le pool. */
  user_id: string | null;
  title: string;
  instagram_link: string | null;
  photo_url: string | null;
  ingredients: RecipeIngredient[];
  steps: string | null;
  tags: string[];
  notes: string | null;
  category: string | null;
  created_at: string;
}

export type RecipeInput = Omit<Recipe, 'id' | 'created_at'>;

export const RECIPE_CATEGORIES = [
  'Pain', 'Banana bread', 'Gâteau', 'Cookie', 'Dessert', 'Viande', 'Poisson',
  'Entrée', 'Plat', 'Salade', 'Petit-déjeuner', 'Sauce', 'Boisson', 'Autre',
] as const;

export const RECIPE_CATEGORY_EMOJI: Record<string, string> = {
  Pain: '🍞',
  'Banana bread': '🍌',
  Gâteau: '🎂',
  Cookie: '🍪',
  Dessert: '🍰',
  Viande: '🍗',
  Poisson: '🐟',
  Entrée: '🥗',
  Plat: '🍽️',
  Salade: '🥙',
  'Petit-déjeuner': '🌅',
  Sauce: '🥣',
  Boisson: '🥤',
  Autre: '📦',
};

export interface Exercise {
  id: string;
  /** null = autrice qui a supprimé son compte : l'exercice reste dans le pool. */
  user_id: string | null;
  title: string;
  instagram_link: string | null;
  photo_url: string | null;
  video_url: string | null;
  muscles: string[];
  description: string | null;
  tags: string[];
  notes: string | null;
  created_at: string;
}

export type ExerciseInput = Omit<Exercise, 'id' | 'created_at'>;

// Échelle d'effort par exercice — le MET (équivalent métabolique, voir
// metValues.ts) varie énormément d'un exercice à l'autre (souplesse ≈ 2 MET,
// sprint ≈ 12+ MET), donc une seule valeur par "musculation" ne suffit pas
// au niveau de l'exercice individuel. Valeurs repères issues du Compendium
// of Physical Activities, cohérentes avec metValues.ts.
export const EXERCISE_INTENSITY_LEVELS = [
  { value: 'tres_legere', label: 'Très légère (étirements, mobilité)', met: 2.3 },
  { value: 'legere', label: 'Légère', met: 3.5 },
  { value: 'moderee', label: 'Modérée', met: 5.0 },
  { value: 'intense', label: 'Intense', met: 7.0 },
  { value: 'tres_intense', label: 'Très intense', met: 9.5 },
  { value: 'maximale', label: 'Maximale (sprint, effort explosif court)', met: 12.0 },
] as const;
export type ExerciseIntensity = (typeof EXERCISE_INTENSITY_LEVELS)[number]['value'];

export interface WorkoutSessionExercise {
  exercise_id: string;
  sets: number | null;
  reps: number | null;
  rest_seconds: number | null;
  duration_minutes: number | null;
  intensity_level: ExerciseIntensity | null;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  exercises: WorkoutSessionExercise[];
  created_at: string;
}

export type WorkoutSessionInput = Omit<WorkoutSession, 'id' | 'created_at'>;

export interface NutritionPer100g {
  calories_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fat_saturated_g: number | null;
  fat_monounsaturated_g: number | null;
  fat_polyunsaturated_g: number | null;
  fiber_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
  calcium_mg: number | null;
  iron_mg: number | null;
  potassium_mg: number | null;
  magnesium_mg: number | null;
  zinc_mg: number | null;
  vitamin_a_mcg: number | null;
  vitamin_c_mg: number | null;
  vitamin_d_mcg: number | null;
  vitamin_e_mg: number | null;
  vitamin_b12_mcg: number | null;
  /** Oméga-3 (ALA+EPA+DHA) — souvent absent des données USDA de base : reste
   * null pour beaucoup d'aliments plutôt qu'une estimation inventée. */
  omega3_g: number | null;
}

export interface IngredientNutrition extends NutritionPer100g {
  id: string;
  reference_item_id: string;
  fdc_id: number | null;
  fdc_description: string | null;
  source: 'usda' | 'manual';
}

export type JournalEntryKind = 'ingredient' | 'recipe';

export const MEALS = ['Petit-déjeuner', 'Déjeuner', 'Dîner', 'Collation'] as const;
export type Meal = (typeof MEALS)[number];

export const ACTIVITY_LEVELS = [
  { value: 'sedentaire', label: 'Sédentaire (peu ou pas de sport)' },
  { value: 'leger', label: 'Légèrement actif (sport 1-3 j/semaine)' },
  { value: 'modere', label: 'Modérément actif (sport 3-5 j/semaine)' },
  { value: 'actif', label: 'Très actif (sport 6-7 j/semaine)' },
  { value: 'tres_actif', label: 'Extrêmement actif (sport intense + travail physique)' },
] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number]['value'];

export const GOALS = [
  { value: 'perte', label: 'Perte de poids' },
  { value: 'maintien', label: 'Maintien' },
  { value: 'prise', label: 'Prise de masse' },
] as const;
export type Goal = (typeof GOALS)[number]['value'];

// Disciplines proposées dans le profil — distinctes des types d'activité du
// carnet (metValues.ts), qui sont découpés par intensité pour le calcul
// calorique (ex: "Vélo modéré"/"Vélo intense") plutôt que par discipline.
export const SPORTS_LIST = [
  'Course à pied', 'Trail', 'Spartan / course d\'obstacles', 'Vélo', 'Natation',
  'Musculation', 'Yoga', 'Étirements / Mobilité', 'Escalade de voie',
  'Escalade de bloc', 'Football', 'Basketball', 'Tennis', 'Danse',
  'Randonnée', 'Ski', 'HIIT / Circuit training',
] as const;

// Échelle de cotation sportive (France), la plus utilisée en salle et en
// falaise — 6a à 9c.
const ROUTE_GRADE_LETTERS = ['a', 'a+', 'b', 'b+', 'c', 'c+'] as const;
export const CLIMBING_ROUTE_GRADES = [6, 7, 8, 9].flatMap((n) =>
  ROUTE_GRADE_LETTERS.map((l) => `${n}${l}`),
);

// Couleurs de cotation bloc — l'ordre varie selon les salles, celui-ci suit
// l'ordre donné (du plus facile au plus dur).
export const CLIMBING_BOULDER_COLORS = [
  'jaune', 'vert', 'turquoise', 'bleu', 'orange', 'rouge', 'noir', 'blanc',
] as const;

export interface Profile {
  id: string; // = auth.uid() de l'utilisatrice
  sex: 'homme' | 'femme' | null;
  birth_date: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity_level: ActivityLevel | null;
  goal: Goal | null;
  goal_weight_change_kg: number | null;
  goal_timeframe_weeks: number | null;
  sports: string[];
  climbing_route_level: string | null;
  climbing_boulder_level: string | null;
  /** Durée moyenne des règles (jours) — pour savoir si on est dedans et
   * estimer la fin, en plus du seul jour de début déjà noté. */
  period_length_days: number | null;
  /** Grossesse/allaitement : pas d'objectifs chiffrés (Mifflin-St Jeor ne s'applique pas). */
  special_situation: SpecialSituation | null;
  updated_at: string;
}

export const SPECIAL_SITUATIONS = [
  { value: 'enceinte', label: 'Enceinte' },
  { value: 'allaitante', label: 'Allaitante' },
] as const;
export type SpecialSituation = (typeof SPECIAL_SITUATIONS)[number]['value'];

export type ProfileInput = Omit<Profile, 'id' | 'updated_at'>;

export interface JournalEntry {
  id: string;
  user_id: string;
  entry_date: string;
  kind: JournalEntryKind;
  reference_item_id: string | null;
  recipe_id: string | null;
  label: string;
  quantity: number;
  unit: string | null;
  meal: string;
  created_at: string;
}

export type JournalEntryInput = Omit<JournalEntry, 'id' | 'created_at'>;

export const INTENSITIES = [
  { value: 'leger', label: 'Légère' },
  { value: 'modere', label: 'Modérée' },
  { value: 'intense', label: 'Intense' },
] as const;
export type Intensity = (typeof INTENSITIES)[number]['value'];

export const TRAINING_TYPES = [
  { value: 'musculation', label: 'Musculation' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'hiit', label: 'HIIT / Circuit training' },
  { value: 'etirement', label: 'Étirement / Mobilité' },
  { value: 'sport_collectif', label: 'Sport collectif' },
  { value: 'autre', label: 'Autre' },
] as const;
export type TrainingType = (typeof TRAINING_TYPES)[number]['value'];

export interface ActivityEntry {
  id: string;
  entry_date: string;
  activity_type: string;
  duration_minutes: number;
  met: number;
  calories_kcal: number;
  intensity: Intensity | null;
  training_type: TrainingType | null;
  /** Forme ressentie ce jour-là, 1 (à plat) à 5 (en pleine forme). */
  felt_form: number | null;
  /** Intensité perçue de la séance, 1 (très facile) à 5 (maximale) — distinct
   * du champ "intensity" catégoriel ci-dessus. */
  effort_intensity: number | null;
  climbing_routes_count: number | null;
  climbing_max_attempted: string | null;
  climbing_max_sent: string | null;
  climbing_hardest_color: string | null;
  climbing_max_color_sends: number | null;
  climbing_below_max_count: number | null;
  workout_session_id: string | null;
  user_id: string | null;
  created_at: string;
}

export type ActivityEntryInput = Omit<ActivityEntry, 'id' | 'created_at'>;

export interface SessionExercise {
  id: string;
  activity_entry_id: string;
  exercise_id: string;
  sets: number | null;
  reps: number | null;
  rest_seconds: number | null;
  duration_minutes: number | null;
  intensity_level: ExerciseIntensity | null;
  calories_kcal: number | null;
  notes: string | null;
  created_at: string;
}

export type SessionExerciseInput = Omit<SessionExercise, 'id' | 'created_at'>;

export interface CycleEntry {
  id: string;
  user_id: string;
  entry_date: string;
  created_at: string;
}

export interface FitnessTest {
  id: string;
  user_id: string;
  entry_date: string;
  test_name: string;
  value: number;
  unit: string;
  created_at: string;
}

export type FitnessTestInput = Omit<FitnessTest, 'id' | 'created_at'>;

export const BEVERAGE_TYPES = [
  { value: 'eau', label: 'Eau', icon: '💧' },
  { value: 'café', label: 'Café', icon: '☕' },
  { value: 'thé', label: 'Thé', icon: '🍵' },
  { value: 'tisane', label: 'Tisane', icon: '🌿' },
] as const;
export type BeverageType = (typeof BEVERAGE_TYPES)[number]['value'];

export interface WaterEntry {
  id: string;
  user_id: string;
  entry_date: string;
  amount_ml: number;
  beverage_type: BeverageType;
  created_at: string;
}

export interface NutritionTotals {
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fat_saturated_g: number;
  fat_monounsaturated_g: number;
  fat_polyunsaturated_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  calcium_mg: number;
  iron_mg: number;
  potassium_mg: number;
  magnesium_mg: number;
  zinc_mg: number;
  vitamin_a_mcg: number;
  vitamin_c_mg: number;
  vitamin_d_mcg: number;
  vitamin_e_mg: number;
  vitamin_b12_mcg: number;
  omega3_g: number;
  glycemic_load: number;
}
