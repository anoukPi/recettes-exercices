import { supabase } from '../lib/supabaseClient';

export type ReferenceType = 'ingredient' | 'unit';

export interface ReferenceItem {
  id: string;
  type: ReferenceType;
  name: string;
  created_at: string;
}

export async function listReferenceItems(type: ReferenceType): Promise<ReferenceItem[]> {
  const { data, error } = await supabase
    .from('reference_items')
    .select('*')
    .eq('type', type)
    .order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addReferenceItem(type: ReferenceType, name: string): Promise<ReferenceItem> {
  const trimmed = name.trim();
  const { data, error } = await supabase
    .from('reference_items')
    .insert({ type, name: trimmed })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      const { data: existing, error: fetchError } = await supabase
        .from('reference_items')
        .select('*')
        .eq('type', type)
        .ilike('name', trimmed)
        .single();
      if (fetchError) throw fetchError;
      return existing;
    }
    throw error;
  }
  return data;
}

export async function renameReferenceItem(id: string, name: string): Promise<ReferenceItem> {
  const { data, error } = await supabase
    .from('reference_items')
    .update({ name: name.trim() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteReferenceItem(id: string): Promise<void> {
  const { error } = await supabase.from('reference_items').delete().eq('id', id);
  if (error) throw error;
}
