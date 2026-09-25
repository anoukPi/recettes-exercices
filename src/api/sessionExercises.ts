import { supabase } from '../lib/supabaseClient';
import { estimateCaloriesBurned } from '../lib/metValues';
import { effortMinutes } from '../lib/exerciseFormat';
import { EXERCISE_INTENSITY_LEVELS, type SessionExercise, type SessionExerciseInput, type WorkoutSession } from '../types';

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

export async function updateSessionExercise(
  id: string,
  input: Omit<SessionExerciseInput, 'activity_entry_id' | 'exercise_id'>,
): Promise<SessionExercise> {
  const { data, error } = await supabase
    .from('activity_session_exercises')
    .update(input)
    .eq('id', id)
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
 * séance (sets/reps/repos/durée/intensité du plan — modifiables ensuite si
 * la réalité a différé, ce qui arrive souvent d'un exercice à l'autre). */
export async function populateFromWorkoutSession(
  activityEntryId: string,
  session: WorkoutSession,
  weightKg: number | null,
): Promise<SessionExercise[]> {
  if (session.exercises.length === 0) return [];
  const rows = session.exercises.map((e) => {
    const met = e.intensity_level
      ? EXERCISE_INTENSITY_LEVELS.find((l) => l.value === e.intensity_level)?.met
      : null;
    const minutes = effortMinutes(e);
    const calories = minutes && met && weightKg ? estimateCaloriesBurned(met, weightKg, minutes) : null;
    return {
      activity_entry_id: activityEntryId,
      exercise_id: e.exercise_id,
      sets: e.sets,
      reps: e.reps,
      rest_seconds: e.rest_seconds,
      duration_minutes: e.duration_minutes,
      duration_unit: e.duration_minutes != null ? (e.duration_unit ?? 'min') : null,
      load_kg: e.load_kg ?? null,
      intensity_level: e.intensity_level,
      calories_kcal: calories,
      notes: null,
    };
  });
  const { data, error } = await supabase.from('activity_session_exercises').insert(rows).select();
  if (error) throw error;
  return data ?? [];
}
