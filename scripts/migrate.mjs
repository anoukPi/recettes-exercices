#!/usr/bin/env node
// Exécute un fichier de migration SQL directement contre la base Postgres,
// via la chaîne de connexion DATABASE_URL de .env.local (Settings → Database
// → Connect → Direct connection, sur le dashboard Supabase).
//
// Usage: node --env-file=.env.local scripts/migrate.mjs supabase/migrations/xxxx_nom.sql

import { readFileSync } from 'node:fs';
import { Client } from 'pg';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/migrate.mjs <chemin-vers-le-fichier.sql>');
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL manquant dans .env.local');
  process.exit(1);
}

const sql = readFileSync(file, 'utf8');
const client = new Client({ connectionString: databaseUrl });

try {
  await client.connect();
  await client.query(sql);
  console.log(`✓ Migration appliquée : ${file}`);
} catch (err) {
  console.error(`✗ Échec de la migration ${file} :`, err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
