import { supabase } from '../lib/supabaseClient';
import type { SessionExercise, SessionExerciseInput } from '../types';

export async function listSessionExercises(activityEntryId: string): Promise<SessionExercise[]> {
  const { data, error } = await supabase
    .from('activity_session_exercises')
    .select('*')
    .eq('activity_entry_id', activityEntryId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addSessionExercise(input: SessionExerciseInput): Promise<SessionExercise> {
  const { data, error } = await supabase
    .from('activity_session_exercises')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSessionExercise(id: string): Promise<void> {
  const { error } = await supabase.from('activity_session_exercises').delete().eq('id', id);
  if (error) throw error;
}
