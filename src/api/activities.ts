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
