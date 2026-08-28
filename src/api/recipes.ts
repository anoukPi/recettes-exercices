import { supabase } from '../lib/supabaseClient';
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

export async function createRecipe(input: RecipeInput): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRecipe(
  id: string,
  input: RecipeInput,
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
