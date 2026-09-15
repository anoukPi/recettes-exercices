export interface RecipeIngredient {
  quantity: string;
  unit: string;
  ingredient: string;
}

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  instagram_link: string | null;
  photo_url: string | null;
  ingredients: RecipeIngredient[];
  steps: string | null;
  tags: string[];
  notes: string | null;
  created_at: string;
}

export type RecipeInput = Omit<Recipe, 'id' | 'created_at'>;

export interface Exercise {
  id: string;
  user_id: string;
  title: string;
  instagram_link: string | null;
  muscles: string[];
  description: string | null;
  tags: string[];
  notes: string | null;
  created_at: string;
}

export type ExerciseInput = Omit<Exercise, 'id' | 'created_at'>;

export interface NutritionPer100g {
  calories_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
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
  updated_at: string;
}

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

export interface NutritionTotals {
  calories_kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
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
  glycemic_load: number;
}
