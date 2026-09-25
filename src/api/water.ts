import { supabase } from '../lib/supabaseClient';
import { getCurrentUserId } from '../lib/auth';
import { activeProfileId } from '../lib/activeProfile';
import type { BeverageType, WaterEntry } from '../types';

export async function listWaterEntries(date: string): Promise<WaterEntry[]> {
  const { data, error } = await supabase
    .from('water_entries')
    .select('*')
    .eq('profile_id', await activeProfileId())
    .eq('entry_date', date)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addWaterEntry(
  date: string,
  amountMl: number,
  beverageType: BeverageType = 'eau',
): Promise<WaterEntry> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Connecte-toi pour suivre ton hydratation.');
  const { data, error } = await supabase
    .from('water_entries')
    .insert({
      entry_date: date,
      amount_ml: amountMl,
      beverage_type: beverageType,
      user_id: userId,
      profile_id: await activeProfileId(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteWaterEntry(id: string): Promise<void> {
  const { error } = await supabase.from('water_entries').delete().eq('id', id);
  if (error) throw error;
}
