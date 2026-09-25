#!/usr/bin/env node
// Sauvegarde complète des données de Kaly (décision d'Anouk, 25/09/2026 :
// rien ne doit jamais être perdu). Copie toutes les tables de l'app + la liste
// des comptes dans un fichier JSON compressé daté. Les copies précédentes ne
// sont JAMAIS supprimées. Une copie par jour : si celle du jour existe déjà,
// on ne fait rien.
//
// Lancée chaque jour par une tâche macOS (launchd, voir
// scripts/ch.kaly.backup.plist) ; à la main :
//   node --env-file=.env.local scripts/backup.mjs [dossier]
//
// Ne sauvegarde pas les fichiers photo eux-mêmes (stockés dans Supabase
// Storage), seulement leurs adresses.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import pg from 'pg';

const DEFAULT_DIR = join(homedir(), 'Library/Mobile Documents/com~apple~CloudDocs/Kaly sauvegardes');
const dir = process.argv[2] ?? DEFAULT_DIR;
const today = new Date().toISOString().slice(0, 10);
const file = join(dir, `kaly-${today}.json.gz`);

if (existsSync(file)) {
  console.log(`${new Date().toISOString()} — copie du jour déjà faite : ${file}`);
  process.exit(0);
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL manquant (lancer avec --env-file=.env.local)');
  process.exit(1);
}

const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await db.connect();
  const { rows: tables } = await db.query(
    `select table_name from information_schema.tables
     where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name`,
  );
  const backup = { created_at: new Date().toISOString(), tables: {} };
  for (const { table_name } of tables) {
    const { rows } = await db.query(`select * from public."${table_name}"`);
    backup.tables[table_name] = rows;
  }
  // Comptes : identité seulement (jamais les mots de passe).
  const { rows: users } = await db.query(
    `select id, email, created_at, last_sign_in_at, banned_until from auth.users order by created_at`,
  );
  backup.accounts = users;

  mkdirSync(dir, { recursive: true });
  writeFileSync(file, gzipSync(JSON.stringify(backup)));
  const total = Object.values(backup.tables).reduce((n, rows) => n + rows.length, 0);
  console.log(`${new Date().toISOString()} — ✓ ${file} (${tables.length} tables, ${total} lignes, ${users.length} comptes)`);
} catch (err) {
  console.error(`${new Date().toISOString()} — ✗ échec de la sauvegarde : ${err.message}`);
  process.exitCode = 1;
} finally {
  await db.end().catch(() => {});
}
