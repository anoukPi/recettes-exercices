# Ma bibliothèque — Recettes & Exercices

Outil web perso (usage solo) pour enregistrer des recettes et exercices trouvés sur Instagram (ou ailleurs), avec tags et filtrage.

Stack : React (Vite) + Supabase + Vercel.

## Mise en route

1. Crée un projet sur [supabase.com](https://supabase.com).
2. Dans l'éditeur SQL du projet, exécute le contenu de [`supabase/schema.sql`](./supabase/schema.sql) pour créer les tables `recipes` et `exercises`.
3. Copie `.env.example` vers `.env.local` et renseigne `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (Project Settings → API).
4. Installe les dépendances et lance le serveur de dev :

```bash
npm install
npm run dev
```

## Déploiement (Vercel)

1. Pousse le repo sur GitHub et importe-le dans Vercel (framework détecté automatiquement : Vite).
2. Dans les paramètres du projet Vercel, ajoute les mêmes variables d'environnement que dans `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

## État actuel (v1)

- [x] Schéma de données (recettes, exercices)
- [x] CRUD complet (créer, lire, modifier, supprimer) pour les deux types
- [x] Bibliothèque avec onglets, recherche par titre, filtre par tags
- [ ] Style visuel à peaufiner (le CSS actuel est volontairement minimal)

## Structure

```
src/
  api/           fonctions CRUD Supabase (recipes, exercises, tags)
  components/     formulaires et vue bibliothèque réutilisables
  pages/          pages routées (liste, détail/édition, création)
  lib/            client Supabase, helpers (parsing des tags)
supabase/
  schema.sql      schéma SQL à exécuter dans Supabase
```
