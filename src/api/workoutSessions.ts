import { supabase } from '../lib/supabaseClient';
import { getCurrentUserId } from '../lib/auth';
import type { WorkoutSession, WorkoutSessionInput } from '../types';

export async function listWorkoutSessions(): Promise<WorkoutSession[]> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getWorkoutSession(id: string): Promise<WorkoutSession> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createWorkoutSession(
  input: Omit<WorkoutSessionInput, 'user_id'>,
): Promise<WorkoutSession> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Connecte-toi pour créer une séance.');
  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({ ...input, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function duplicateWorkoutSession(source: WorkoutSession): Promise<WorkoutSession> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Connecte-toi pour dupliquer une séance.');
  const { id: _id, user_id: _userId, created_at: _createdAt, ...rest } = source;
  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({ ...rest, title: `${source.title} (copie)`, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateWorkoutSession(
  id: string,
  input: Omit<WorkoutSessionInput, 'user_id'>,
): Promise<WorkoutSession> {
  const { data, error } = await supabase
    .from('workout_sessions')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteWorkoutSession(id: string): Promise<void> {
  const { error } = await supabase.from('workout_sessions').delete().eq('id', id);
  if (error) throw error;
}
