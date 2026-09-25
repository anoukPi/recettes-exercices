import { supabase } from '../lib/supabaseClient';
import { getCurrentUserId } from '../lib/auth';
import { activeProfileId } from '../lib/activeProfile';
import type { JournalEntry, JournalEntryInput } from '../types';

export async function listJournalEntries(date: string): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('profile_id', await activeProfileId())
    .eq('entry_date', date)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listJournalEntriesInRange(startDate: string, endDate: string): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('profile_id', await activeProfileId())
    .gte('entry_date', startDate)
    .lte('entry_date', endDate);
  if (error) throw error;
  return data ?? [];
}

export interface FrequentJournalItem {
  kind: JournalEntry['kind'];
  reference_item_id: string | null;
  recipe_id: string | null;
  label: string;
  quantity: number;
  unit: string | null;
  count: number;
}

/** Aliments/plats les plus ajoutés récemment — pour un ajout rapide en un
 * tap, avec la dernière quantité/mesure utilisée pré-remplie. */
export async function listFrequentJournalItems(days = 30, limit = 10): Promise<FrequentJournalItem[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceKey = since.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('journal_entries')
    .select('kind, reference_item_id, recipe_id, label, quantity, unit, entry_date, created_at')
    .eq('profile_id', await activeProfileId())
    .gte('entry_date', sinceKey)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;

  const byKey = new Map<string, FrequentJournalItem>();
  for (const e of data ?? []) {
    const key = e.kind === 'recipe' ? `recipe:${e.recipe_id}` : `ingredient:${e.reference_item_id}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      byKey.set(key, {
        kind: e.kind,
        reference_item_id: e.reference_item_id,
        recipe_id: e.recipe_id,
        label: e.label,
        quantity: e.quantity,
        unit: e.unit,
        count: 1,
      });
    }
  }
  return [...byKey.values()].sort((a, b) => b.count - a.count).slice(0, limit);
}

export async function updateJournalEntryQuantity(id: string, quantity: number): Promise<JournalEntry> {
  const { data, error } = await supabase
    .from('journal_entries')
    .update({ quantity })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addJournalEntry(input: Omit<JournalEntryInput, 'user_id'>): Promise<JournalEntry> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Connecte-toi pour ajouter une entrée au carnet.');
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({ ...input, user_id: userId, profile_id: await activeProfileId() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const { error } = await supabase.from('journal_entries').delete().eq('id', id);
  if (error) throw error;
}
