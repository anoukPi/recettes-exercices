import { supabase } from '../lib/supabaseClient';
import { getCurrentUserId } from '../lib/auth';

export async function listMyEndorsedRecipeIds(): Promise<Set<string>> {
  const userId = await getCurrentUserId();
  if (!userId) return new Set();
  const { data, error } = await supabase
    .from('recipe_endorsements')
    .select('recipe_id')
    .eq('user_id', userId);
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.recipe_id));
}

export async function listEndorsementCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from('recipe_endorsements').select('recipe_id');
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.recipe_id] = (counts[row.recipe_id] ?? 0) + 1;
  }
  return counts;
}

export async function endorseRecipe(recipeId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Connecte-toi pour marquer une recette comme testée.');
  const { error } = await supabase
    .from('recipe_endorsements')
    .insert({ recipe_id: recipeId, user_id: userId });
  if (error) throw error;
}

export async function removeEndorsement(recipeId: string): Promise<void> {
  const userId = await getCurrentUserId();
  if (!userId) return;
  const { error } = await supabase
    .from('recipe_endorsements')
    .delete()
    .eq('recipe_id', recipeId)
    .eq('user_id', userId);
  if (error) throw error;
}
