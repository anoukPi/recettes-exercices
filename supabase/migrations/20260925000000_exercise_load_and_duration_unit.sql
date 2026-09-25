-- Migration 026 — séances : charge (lesté, en kg) et unité de durée choisie
-- (s / min / h). La durée reste stockée en minutes (duration_minutes) pour le
-- calcul des calories ; l'unité sert à la saisie et à l'affichage. Les
-- exercices prévus d'une séance vivent en JSON (workout_sessions.exercises) :
-- pas de colonne à ajouter là, seulement ici pour les exercices réellement faits.

alter table activity_session_exercises add column if not exists load_kg numeric;
alter table activity_session_exercises add column if not exists duration_unit text
  check (duration_unit in ('s', 'min', 'h'));
