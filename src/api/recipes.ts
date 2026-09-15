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
