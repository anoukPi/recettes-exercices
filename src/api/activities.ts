import { supabase } from '../lib/supabaseClient';
import { getCurrentUserId } from '../lib/auth';
import { activeProfileId } from '../lib/activeProfile';
import type { ActivityEntry, ActivityEntryInput } from '../types';

export async function listActivityEntries(date: string): Promise<ActivityEntry[]> {
  const { data, error } = await supabase
    .from('activity_entries')
    .select('*')
    .eq('profile_id', await activeProfileId())
    .eq('entry_date', date)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listActivityEntriesInRange(startDate: string, endDate: string): Promise<ActivityEntry[]> {
  const { data, error } = await supabase
    .from('activity_entries')
    .select('*')
    .eq('profile_id', await activeProfileId())
    .gte('entry_date', startDate)
    .lte('entry_date', endDate);
  if (error) throw error;
  return data ?? [];
}

/** Le workout_session_id de l'activité loguée la plus récente qui en a une —
 * pour proposer "répéter la dernière séance" sans tout re-sélectionner. */
/** Activités déjà notées par l'utilisatrice, avec le MET de la plus récente —
 * pour retrouver ses activités personnalisées (et leur MET) d'une fois à
 * l'autre et d'un appareil à l'autre. */
export async function listPastActivityMets(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('activity_entries')
    .select('activity_type, met')
    .eq('profile_id', await activeProfileId())
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error) throw error;
  const mets: Record<string, number> = {};
  for (const row of data ?? []) {
    if (row.activity_type && row.met != null && !(row.activity_type in mets)) mets[row.activity_type] = Number(row.met);
  }
  return mets;
}

export async function getLastWorkoutSessionId(): Promise<string | null> {
  const { data, error } = await supabase
    .from('activity_entries')
    .select('workout_session_id')
    .eq('profile_id', await activeProfileId())
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
    .insert({ ...input, user_id: userId, profile_id: await activeProfileId() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateActivityEntry(
  id: string,
  input: Omit<ActivityEntryInput, 'user_id'>,
): Promise<ActivityEntry> {
  const { data, error } = await supabase
    .from('activity_entries')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteActivityEntry(id: string): Promise<void> {
  const { error } = await supabase.from('activity_entries').delete().eq('id', id);
  if (error) throw error;
}

/** Au moins une activité notée pour le profil actif (premiers pas). */
export async function hasAnyActivityEntry(): Promise<boolean> {
  const { data, error } = await supabase
    .from('activity_entries')
    .select('id')
    .eq('profile_id', await activeProfileId())
    .limit(1);
  if (error) throw error;
  return (data ?? []).length > 0;
}
