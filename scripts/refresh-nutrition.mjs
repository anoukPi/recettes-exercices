#!/usr/bin/env node
// Recalcule le cache ingredient_nutrition avec la logique actuelle de l'app
// (src/lib/nutritionLookup.ts) et affiche les différences. Sans --apply, rien
// n'est écrit. Les saisies manuelles (source 'manual' hors valeurs de
// référence) ne sont jamais touchées.
//
// Usage: node --env-file=.env.local scripts/refresh-nutrition.mjs [--apply]
import { createServer } from 'vite';
import pg from 'pg';

const apply = process.argv.includes('--apply');
const NUTRIENT_KEYS = [
  'calories_kcal', 'protein_g', 'carbs_g', 'fat_g', 'fat_saturated_g', 'fat_monounsaturated_g',
  'fat_polyunsaturated_g', 'fiber_g', 'sugar_g', 'sodium_mg', 'calcium_mg', 'iron_mg', 'potassium_mg',
  'magnesium_mg', 'zinc_mg', 'vitamin_a_mcg', 'vitamin_c_mg', 'vitamin_d_mcg', 'vitamin_e_mg',
  'vitamin_b12_mcg', 'omega3_g',
];

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  const { lookupNutrition, hasNutritionSource } = await server.ssrLoadModule('/src/lib/nutritionLookup.ts');
  const { referenceNutritionFor } = await server.ssrLoadModule('/src/lib/referenceNutrition.ts');
  const { AMBIGUOUS_INGREDIENTS } = await server.ssrLoadModule('/src/lib/ingredientDisambiguation.ts');

  const orphans = Object.values(AMBIGUOUS_INGREDIENTS).flat().filter((v) => !hasNutritionSource(v));
  if (orphans.length) console.log(`⚠ Variantes sans source nutritionnelle : ${orphans.join(', ')}\n`);

  await db.connect();
  const { rows } = await db.query(
    `select n.*, r.name from ingredient_nutrition n join reference_items r on r.id = n.reference_item_id order by r.name`,
  );

  const updates = [];
  const deletions = [];
  for (const row of rows) {
    if (row.source === 'manual' && !referenceNutritionFor(row.name)) continue;
    const found = await lookupNutrition(row.name, process.env.VITE_USDA_API_KEY);
    if (!found) {
      deletions.push(row);
      console.log(`✗ ${row.name} — aucune source (ancienne valeur : ${row.fdc_description}) → supprimée du cache`);
      continue;
    }
    const oldKcal = row.calories_kcal === null ? null : Number(row.calories_kcal);
    const changed =
      found.fdc_id !== row.fdc_id ||
      found.source !== row.source ||
      NUTRIENT_KEYS.some((k) => (row[k] === null ? null : Number(row[k])) !== found.values[k]);
    if (!changed) continue;
    updates.push({ row, found });
    console.log(
      `~ ${row.name}: ${row.fdc_description ?? '—'} (${Math.round(oldKcal)} kcal) → ` +
        `${found.fdc_description} (${Math.round(found.values.calories_kcal)} kcal)`,
    );
  }

  console.log(`\n${updates.length} mise(s) à jour, ${deletions.length} suppression(s) sur ${rows.length} lignes.`);
  if (!apply) {
    console.log('Aperçu seulement — relancer avec --apply pour écrire.');
  } else {
    await db.query('begin');
    for (const { row, found } of updates) {
      const cols = ['source', 'fdc_id', 'fdc_description', ...NUTRIENT_KEYS];
      const vals = [found.source, found.fdc_id, found.fdc_description, ...NUTRIENT_KEYS.map((k) => found.values[k])];
      await db.query(
        `update ingredient_nutrition set ${cols.map((c, i) => `${c} = $${i + 1}`).join(', ')}, updated_at = now() where id = $${cols.length + 1}`,
        [...vals, row.id],
      );
    }
    for (const row of deletions) await db.query('delete from ingredient_nutrition where id = $1', [row.id]);
    await db.query('commit');
    console.log('✓ Cache mis à jour.');
  }
} finally {
  await db.end().catch(() => {});
  await server.close();
}
