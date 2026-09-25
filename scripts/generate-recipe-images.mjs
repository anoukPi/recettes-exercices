#!/usr/bin/env node
// Génère une image IA (Pollinations) pour chaque recette sans photo ni image
// IA, la stocke dans le bucket public recipe-photos (dossier ai/) et remplit
// recipes.ai_image_url. Ne touche jamais photo_url : une vraie photo reste
// prioritaire. Seuls le titre, la catégorie et les ingrédients principaux
// (traduits en anglais) sont envoyés au service.
//
// Il faut une clé Pollinations (gratuite) : POLLINATIONS_API_KEY dans .env.local
// — jamais en VITE_ (elle finirait dans le code public de l'app).
//
// Usage :
//   node --env-file=.env.local scripts/generate-recipe-images.mjs            # aperçu des prompts
//   node --env-file=.env.local scripts/generate-recipe-images.mjs --apply    # génère et enregistre
//   … --apply --limit 3            # seulement 3 recettes (pour tester)
//   … --apply --redo <recipe-id>   # régénère l'image IA d'une recette (autre seed)
import { createServer } from 'vite';
import pg from 'pg';

const apply = process.argv.includes('--apply');
const limitArg = process.argv.indexOf('--limit');
const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;
const redoArg = process.argv.indexOf('--redo');
const redoId = redoArg > -1 ? process.argv[redoArg + 1] : null;
const KEY = process.env.POLLINATIONS_API_KEY;
const MODEL = process.env.POLLINATIONS_MODEL || 'zimage';
const BUCKET = 'recipe-photos';

if (apply && !KEY) {
  console.error('POLLINATIONS_API_KEY manquante dans .env.local (clé gratuite sur https://enter.pollinations.ai).');
  process.exit(1);
}

function cleanTitle(title) {
  return title.replace(/^À nommer\s*[—-]\s*/i, '').trim();
}

function mainIngredients(ingredients, translate) {
  // Les ingrédients en grammes les plus lourds d'abord, puis les autres.
  const scored = ingredients
    .filter((i) => i.ingredient?.trim())
    .map((i) => {
      const q = parseFloat(String(i.quantity).replace(',', '.'));
      const grams = /^(g|gr|grammes?|ml)$/i.test(i.unit?.trim() ?? '') && !Number.isNaN(q) ? q : 0;
      return { name: i.ingredient.trim(), grams };
    })
    .sort((a, b) => b.grams - a.grams);
  const names = [];
  for (const { name } of scored) {
    const en = translate(name);
    if (!names.includes(en)) names.push(en);
    if (names.length >= 6) break;
  }
  return names;
}

function buildPrompt(recipe, translate) {
  const ingredients = mainIngredients(recipe.ingredients ?? [], translate);
  return [
    `Appetizing professional food photography of the homemade dish "${cleanTitle(recipe.title)}"`,
    recipe.category ? `(${recipe.category})` : '',
    ingredients.length ? `made with ${ingredients.join(', ')}.` : '.',
    'Realistic, served on a simple ceramic plate, 3/4 overhead view, soft natural daylight,',
    'light beige linen tablecloth, minimalist styling, shallow depth of field, no text, no watermark, no people.',
  ]
    .filter(Boolean)
    .join(' ');
}

async function generate(prompt, seed) {
  const url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?model=${MODEL}&width=1024&height=768&seed=${seed}&nologo=true`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${KEY}` } });
    const type = res.headers.get('content-type') ?? '';
    if (res.ok && type.startsWith('image/')) return { bytes: Buffer.from(await res.arrayBuffer()), type };
    const body = await res.text().catch(() => '');
    if (attempt === 3 || res.status === 401 || res.status === 402) {
      throw new Error(`Pollinations ${res.status} : ${body.slice(0, 200)}`);
    }
    await new Promise((r) => setTimeout(r, 4000 * attempt));
  }
  throw new Error('inatteignable');
}

async function upload(path, bytes, type) {
  const res = await fetch(`${process.env.VITE_SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': type,
      'x-upsert': 'true',
    },
    body: bytes,
  });
  if (!res.ok) throw new Error(`Stockage ${res.status} : ${(await res.text()).slice(0, 200)}`);
  return `${process.env.VITE_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  const { INGREDIENT_EN } = await server.ssrLoadModule('/src/lib/ingredientTranslations.ts');
  const translate = (name) => INGREDIENT_EN[name.trim().toLowerCase()] ?? name;

  await db.connect();
  const { rows } = redoId
    ? await db.query('select id, title, category, ingredients from recipes where id = $1', [redoId])
    : await db.query(
        'select id, title, category, ingredients from recipes where photo_url is null and ai_image_url is null order by created_at',
      );
  const todo = rows.slice(0, limit);
  console.log(`${rows.length} recette(s) sans image${todo.length < rows.length ? ` — ${todo.length} traitée(s)` : ''}.\n`);

  let done = 0;
  for (const recipe of todo) {
    const prompt = buildPrompt(recipe, translate);
    if (!apply) {
      console.log(`• ${recipe.title}\n  ${prompt}\n`);
      continue;
    }
    try {
      const seed = redoId ? Math.floor(Math.random() * 1e6) : 1000 + done;
      const { bytes, type } = await generate(prompt, seed);
      const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
      const url = await upload(`ai/${recipe.id}-${seed}.${ext}`, bytes, type);
      await db.query('update recipes set ai_image_url = $1 where id = $2', [url, recipe.id]);
      done++;
      console.log(`✓ ${recipe.title}`);
    } catch (err) {
      console.log(`✗ ${recipe.title} — ${err.message}`);
    }
  }
  if (apply) console.log(`\n${done} image(s) générée(s).`);
  else console.log('Aperçu seulement — relancer avec --apply (et POLLINATIONS_API_KEY) pour générer.');
} finally {
  await db.end().catch(() => {});
  await server.close();
}
