import { supabase } from '../lib/supabaseClient';

const RECIPE_PHOTOS_BUCKET = 'recipe-photos';
const EXERCISE_MEDIA_BUCKET = 'exercise-media';

export async function uploadRecipePhoto(file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(RECIPE_PHOTOS_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(RECIPE_PHOTOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadExercisePhoto(file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(EXERCISE_MEDIA_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(EXERCISE_MEDIA_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
