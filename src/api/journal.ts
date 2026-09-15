import { supabase } from '../lib/supabaseClient';
import type { JournalEntry, JournalEntryInput } from '../types';

export async function listJournalEntries(date: string): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('entry_date', date)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addJournalEntry(input: JournalEntryInput): Promise<JournalEntry> {
  const { data, error } = await supabase.from('journal_entries').insert(input).select().single();
  if (error) throw error;
  return data;
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const { error } = await supabase.from('journal_entries').delete().eq('id', id);
  if (error) throw error;
}
