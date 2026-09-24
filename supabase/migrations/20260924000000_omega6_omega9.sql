-- Migration 025 — oméga-6 et oméga-9, à côté des oméga-3 déjà suivis.
-- Oméga-6 = acide linoléique (18:2) + GLA (18:3 n-6) + 20:2/20:3 n-6 + acide
-- arachidonique (20:4) ; oméga-9 = acide oléique (18:1) + 20:1 + 22:1.

alter table ingredient_nutrition add column if not exists omega6_g numeric;
alter table ingredient_nutrition add column if not exists omega9_g numeric;
