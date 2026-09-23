import { supabase } from '../lib/supabaseClient';
import { getCurrentUserId } from '../lib/auth';

// Tables privées filtrées par user_id (la RLS ne renvoie de toute façon que
// les lignes de l'utilisatrice connectée — le filtre explicite rend l'export
// lisible même si une policy s'élargit un jour).
const OWN_TABLES = [
  'journal_entries',
  'activity_entries',
  'water_entries',
  'cycle_entries',
  'fitness_tests',
  'workout_sessions',
  'recipe_endorsements',
  'recipes',
  'exercises',
] as const;

/** Toutes les données de l'utilisatrice connectée, pour un export JSON. */
export async function exportMyData(): Promise<Record<string, unknown>> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Connecte-toi pour exporter tes données.');

  const result: Record<string, unknown> = { exported_at: new Date().toISOString() };

  const { data: profile, error: profileError } = await supabase.from('profile').select('*').eq('id', userId).maybeSingle();
  if (profileError) throw profileError;
  result.profile = profile;

  for (const table of OWN_TABLES) {
    const { data, error } = await supabase.from(table).select('*').eq('user_id', userId);
    if (error) throw error;
    result[table] = data;
  }

  // Détail des séances : rattaché aux activités (pas de user_id propre).
  const activityIds = ((result.activity_entries as { id: string }[]) ?? []).map((a) => a.id);
  if (activityIds.length > 0) {
    const { data, error } = await supabase
      .from('activity_session_exercises')
      .select('*')
      .in('activity_entry_id', activityIds);
    if (error) throw error;
    result.activity_session_exercises = data;
  }

  return result;
}

/** Supprime définitivement le compte et les données privées (carnets, profil,
 * suivis). Les recettes et exercices partagés restent dans le pool, anonymisés. */
export async function deleteMyAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;
  await supabase.auth.signOut();
}
