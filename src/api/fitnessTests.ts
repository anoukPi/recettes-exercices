import { supabase } from '../lib/supabaseClient';
import { getCurrentUserId } from '../lib/auth';
import type { FitnessTest, FitnessTestInput } from '../types';

export async function listFitnessTests(): Promise<FitnessTest[]> {
  const { data, error } = await supabase
    .from('fitness_tests')
    .select('*')
    .order('entry_date', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addFitnessTest(input: Omit<FitnessTestInput, 'user_id'>): Promise<FitnessTest> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error('Connecte-toi pour ajouter un test.');
  const { data, error } = await supabase
    .from('fitness_tests')
    .insert({ ...input, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFitnessTest(id: string): Promise<void> {
  const { error } = await supabase.from('fitness_tests').delete().eq('id', id);
  if (error) throw error;
}
