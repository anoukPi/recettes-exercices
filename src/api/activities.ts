import { supabase } from '../lib/supabaseClient';
import { getCurrentUserId } from '../lib/auth';
import type { ActivityEntry, ActivityEntryInput } from '../types';

export async function listActivityEntries(date: string): Promise<ActivityEntry[]> {
  const { data, error } = await supabase
    .from('activity_entries')
    .select('*')
    .eq('entry_date', date)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listActivityEntriesInRange(startDate: string, endDate: string): Promise<ActivityEntry[]> {
  const { data, error } = await supabase
    .from('activity_entries')
    .select('*')
    .gte('entry_date', startDate)
    .lte('entry_date', endDate);
  if (error) throw error;
  return data ?? [];
}

/** Le workout_session_id de l'activité loguée la plus récente qui en a une —
 * pour proposer "répéter la dernière séance" sans tout re-sélectionner. */
export async function getLastWorkoutSessionId(): Promise<string | null> {
  const { data, error } = await supabase
    .from('activity_entries')
    .select('workout_session_id')
    .not('workout_session_id', 'is', null)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.workout_session_id ?? null;
}

export async function addActivityEntry(input: Omit<ActivityEntryInput, 'user_id'>): Promise<ActivityEntry> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Connecte-toi pour ajouter une activité.');
  const { data, error } = await supabase
    .from('activity_entries')
    .insert({ ...input, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteActivityEntry(id: string): Promise<void> {
  const { error } = await supabase.from('activity_entries').delete().eq('id', id);
  if (error) throw error;
}
