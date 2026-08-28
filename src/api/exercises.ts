import { supabase } from '../lib/supabaseClient';
import type { Exercise, ExerciseInput } from '../types';

export async function listExercises(): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getExercise(id: string): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createExercise(input: ExerciseInput): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercises')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateExercise(
  id: string,
  input: ExerciseInput,
): Promise<Exercise> {
  const { data, error } = await supabase
    .from('exercises')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExercise(id: string): Promise<void> {
  const { error } = await supabase.from('exercises').delete().eq('id', id);
  if (error) throw error;
}
