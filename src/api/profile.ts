import { supabase } from '../lib/supabaseClient';
import { getCurrentUserId } from '../lib/auth';
import type { Profile, ProfileInput } from '../types';

export async function getProfile(): Promise<Profile | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const { data, error } = await supabase.from('profile').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveProfile(input: ProfileInput): Promise<Profile> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Connecte-toi pour enregistrer ton profil.');
  const { data, error } = await supabase
    .from('profile')
    .upsert({ id: userId, ...input }, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}
