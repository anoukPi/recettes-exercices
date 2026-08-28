import { supabase } from '../lib/supabaseClient';

async function listDistinctValues(
  table: 'recipes' | 'exercises',
  column: 'tags' | 'muscles',
): Promise<string[]> {
  const { data, error } = await supabase.from(table).select(column);
  if (error) throw error;
  const values = new Set<string>();
  for (const row of (data ?? []) as Record<string, string[]>[]) {
    for (const value of row[column] ?? []) values.add(value);
  }
  return Array.from(values).sort((a, b) => a.localeCompare(b));
}

export function listRecipeTags(): Promise<string[]> {
  return listDistinctValues('recipes', 'tags');
}

export function listExerciseTags(): Promise<string[]> {
  return listDistinctValues('exercises', 'tags');
}

export function listExerciseMuscles(): Promise<string[]> {
  return listDistinctValues('exercises', 'muscles');
}
