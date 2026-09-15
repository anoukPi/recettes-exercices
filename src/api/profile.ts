import { supabase } from '../lib/supabaseClient';
import type { Profile, ProfileInput } from '../types';

export async function getProfile(): Promise<Profile | null> {
  const { data, error } = await supabase.from('profile').select('*').eq('id', 'me').maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveProfile(input: ProfileInput): Promise<Profile> {
  const { data, error } = await supabase
    .from('profile')
    .upsert({ id: 'me', ...input }, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}
