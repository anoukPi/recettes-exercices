#!/usr/bin/env node
// Rejoue la recherche USDA + le choix automatique de l'app (src/lib/usdaMatch.ts)
// pour une liste de requêtes, et affiche le résultat retenu — pour vérifier une
// traduction avant de l'ajouter dans src/lib/ingredientTranslations.ts.
//
// Usage: node --env-file=.env.local scripts/usda-probe.mjs "oat milk" "cocoa powder" ...
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { pickBestFood, parseNutrition } = await server.ssrLoadModule('/src/lib/usdaMatch.ts');
  const verbose = process.argv.includes('--all');
  for (const query of process.argv.slice(2).filter((a) => a !== '--all')) {
    const url =
      `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(process.env.VITE_USDA_API_KEY)}` +
      `&query=${encodeURIComponent(query)}&pageSize=10&dataType=Foundation,SR%20Legacy`;
    let res = await fetch(url);
    // L'API USDA renvoie parfois une page d'erreur HTML transitoire : on réessaie une fois.
    if (!res.ok || !res.headers.get('content-type')?.includes('json')) res = await fetch(url);
    const data = await res.json();
    const foods = data.foods ?? [];
    const best = pickBestFood(foods, query);
    const n = best ? parseNutrition(best) : null;
    console.log(
      `${query} → ${best ? `${best.fdcId} ${best.description} | ${Math.round(n.calories_kcal)} kcal P${n.protein_g} G${n.carbs_g} L${n.fat_g}` : 'aucun résultat'}`,
    );
    if (verbose) for (const f of foods) console.log(`    · ${f.fdcId} ${f.description}`);
  }
} finally {
  await server.close();
}
