import { supabase } from '../lib/supabaseClient';
import type { SessionExercise, SessionExerciseInput, WorkoutSession } from '../types';

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

/** Pré-remplit le log d'une activité à partir des exercices prévus dans une
 * séance (sets/reps/repos du plan — modifiables ensuite si la réalité a
 * différé). */
export async function populateFromWorkoutSession(
  activityEntryId: string,
  session: WorkoutSession,
): Promise<SessionExercise[]> {
  if (session.exercises.length === 0) return [];
  const rows = session.exercises.map((e) => ({
    activity_entry_id: activityEntryId,
    exercise_id: e.exercise_id,
    sets: e.sets,
    reps: e.reps,
    rest_seconds: e.rest_seconds,
    notes: null,
  }));
  const { data, error } = await supabase.from('activity_session_exercises').insert(rows).select();
  if (error) throw error;
  return data ?? [];
}
