import { supabase } from '../lib/supabaseClient';
import { getCurrentUserId } from '../lib/auth';
import { activeProfileId } from '../lib/activeProfile';
import type { CycleEntry } from '../types';

export async function listCycleEntries(): Promise<CycleEntry[]> {
  const { data, error } = await supabase
    .from('cycle_entries')
    .select('*')
    .eq('profile_id', await activeProfileId())
    .order('entry_date', { ascending: false })
    .limit(24);
  if (error) throw error;
  return data ?? [];
}

export async function addCycleEntry(entryDate: string): Promise<CycleEntry> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Connecte-toi pour noter une date.');
  const { data, error } = await supabase
    .from('cycle_entries')
    .insert({ entry_date: entryDate, user_id: userId, profile_id: await activeProfileId() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCycleEntry(id: string): Promise<void> {
  const { error } = await supabase.from('cycle_entries').delete().eq('id', id);
  if (error) throw error;
}
