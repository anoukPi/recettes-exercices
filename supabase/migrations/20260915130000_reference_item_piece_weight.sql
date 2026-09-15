-- Migration 016 — poids d'une pièce personnalisable par ingrédient de référence
-- (pour les aliments loués en "pièce"/"unité" absents des tables de poids codées en dur)

alter table reference_items add column if not exists piece_weight_g numeric;
