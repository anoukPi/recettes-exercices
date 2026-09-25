import { supabase } from '../lib/supabaseClient';
import { getCurrentUserId } from '../lib/auth';
import { activeProfileId } from '../lib/activeProfile';
import type { Profile, ProfileInput } from '../types';

/** Profil actif (toi ou un profil ajouté, ex. un enfant). */
export async function getProfile(): Promise<Profile | null> {
  const id = await activeProfileId();
  const { data, error } = await supabase.from('profile').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveProfile(input: ProfileInput): Promise<Profile> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Connecte-toi pour enregistrer ton profil.');
  const id = await activeProfileId();
  // id / account_id après l'input : un profil passé tel quel (spread) ne peut
  // pas changer de profil ni de compte.
  const { id: _id, account_id: _account, created_at: _created, updated_at: _updated, ...rest } = input as ProfileInput &
    Partial<Pick<Profile, 'id' | 'account_id' | 'created_at' | 'updated_at'>>;
  const { data, error } = await supabase
    .from('profile')
    .upsert({ ...rest, id, account_id: userId }, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Tous les profils du compte connecté, le principal en premier. */
export async function listProfiles(): Promise<Profile[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from('profile')
    .select('*')
    .eq('account_id', userId)
    .is('archived_at', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  const rows = data ?? [];
  return [...rows.filter((p) => p.id === userId), ...rows.filter((p) => p.id !== userId)];
}

export async function createProfile(input: {
  display_name: string;
  birth_date: string | null;
  sex: Profile['sex'];
}): Promise<Profile> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Connecte-toi pour ajouter un profil.');
  const { data, error } = await supabase
    .from('profile')
    .insert({ ...input, account_id: userId, sports: [] })
    .select()
    .single();
  if (error) throw error;
  return data;
}
