import { supabase } from '../lib/supabaseClient';
import { getCurrentUserId } from '../lib/auth';
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

export async function createExercise(input: Omit<ExerciseInput, 'user_id'>): Promise<Exercise> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Connecte-toi pour ajouter un exercice.');
  const { data, error } = await supabase
    .from('exercises')
    .insert({ ...input, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function duplicateExercise(source: Exercise): Promise<Exercise> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Connecte-toi pour dupliquer un exercice.');
  const { id: _id, user_id: _userId, created_at: _createdAt, ...rest } = source;
  const { data, error } = await supabase
    .from('exercises')
    .insert({ ...rest, title: `${source.title} (copie)`, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateExercise(
  id: string,
  input: Omit<ExerciseInput, 'user_id'>,
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
