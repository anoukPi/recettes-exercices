import { supabase } from '../lib/supabaseClient';
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

export async function addActivityEntry(input: ActivityEntryInput): Promise<ActivityEntry> {
  const { data, error } = await supabase.from('activity_entries').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function deleteActivityEntry(id: string): Promise<void> {
  const { error } = await supabase.from('activity_entries').delete().eq('id', id);
  if (error) throw error;
}
