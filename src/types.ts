export interface Recipe {
  id: string;
  title: string;
  instagram_link: string | null;
  ingredients: string | null;
  steps: string | null;
  tags: string[];
  notes: string | null;
  created_at: string;
}

export type RecipeInput = Omit<Recipe, 'id' | 'created_at'>;

export interface Exercise {
  id: string;
  title: string;
  instagram_link: string | null;
  muscles: string[];
  description: string | null;
  tags: string[];
  notes: string | null;
  created_at: string;
}

export type ExerciseInput = Omit<Exercise, 'id' | 'created_at'>;
