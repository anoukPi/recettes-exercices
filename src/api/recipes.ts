import { supabase } from '../lib/supabaseClient';
import { getCurrentUserId } from '../lib/auth';
import type { Recipe, RecipeInput } from '../types';

export async function listRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getRecipe(id: string): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createRecipe(input: Omit<RecipeInput, 'user_id'>): Promise<Recipe> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Connecte-toi pour ajouter une recette.');
  const { data, error } = await supabase
    .from('recipes')
    .insert({ ...input, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function duplicateRecipe(source: Recipe): Promise<Recipe> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Connecte-toi pour dupliquer une recette.');
  const { id: _id, user_id: _userId, created_at: _createdAt, ...rest } = source;
  const { data, error } = await supabase
    .from('recipes')
    .insert({ ...rest, title: `${source.title} (copie)`, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRecipe(
  id: string,
  input: Omit<RecipeInput, 'user_id'>,
): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRecipe(id: string): Promise<void> {
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) throw error;
}

/** Les 5 recettes les plus loguées dans le carnet ces 30 derniers jours. */
export async function getFavoriteRecipeIds(days = 30, limit = 5): Promise<string[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceKey = since.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('journal_entries')
    .select('recipe_id')
    .eq('kind', 'recipe')
    .gte('entry_date', sinceKey);
  if (error) throw error;

  const countByRecipeId = new Map<string, number>();
  for (const row of data ?? []) {
    if (!row.recipe_id) continue;
    countByRecipeId.set(row.recipe_id, (countByRecipeId.get(row.recipe_id) ?? 0) + 1);
  }
  return [...countByRecipeId.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
}
