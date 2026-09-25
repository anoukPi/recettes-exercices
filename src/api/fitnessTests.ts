import { supabase } from '../lib/supabaseClient';
import { getCurrentUserId } from '../lib/auth';
import { activeProfileId } from '../lib/activeProfile';
import type { FitnessTest, FitnessTestInput } from '../types';

export async function listFitnessTests(): Promise<FitnessTest[]> {
  const { data, error } = await supabase
    .from('fitness_tests')
    .select('*')
    .eq('profile_id', await activeProfileId())
    .order('entry_date', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addFitnessTest(input: Omit<FitnessTestInput, 'user_id'>): Promise<FitnessTest> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Connecte-toi pour ajouter un test.');
  const { data, error } = await supabase
    .from('fitness_tests')
    .insert({ ...input, user_id: userId, profile_id: await activeProfileId() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFitnessTest(id: string): Promise<void> {
  const { error } = await supabase.from('fitness_tests').delete().eq('id', id);
  if (error) throw error;
}

const TEST_MEDIA_BUCKET = 'test-media';

/** Envoie une photo/vidéo de test dans le bucket PRIVÉ (dossier = id de
 * l'utilisatrice) et renvoie son chemin — jamais d'URL publique. */
export async function uploadTestMedia(file: File): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Connecte-toi pour ajouter une photo ou une vidéo.');
  const ext = file.name.split('.').pop() ?? (file.type.startsWith('video') ? 'mp4' : 'jpg');
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(TEST_MEDIA_BUCKET).upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

/** URL temporaire (1 h) pour afficher un média privé. */
export async function signedTestMediaUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(TEST_MEDIA_BUCKET).createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

/** Date du test le plus récent (toutes catégories), pour le rappel mensuel. */
export async function getLastFitnessTestDate(): Promise<string | null> {
  const { data, error } = await supabase
    .from('fitness_tests')
    .select('entry_date')
    .eq('profile_id', await activeProfileId())
    .order('entry_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.entry_date ?? null;
}
