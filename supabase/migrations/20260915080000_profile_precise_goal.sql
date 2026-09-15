-- Migration 011 — objectif de poids précis (ex. "perdre 1kg en 2 mois")

alter table profile add column if not exists goal_weight_change_kg numeric;
alter table profile add column if not exists goal_timeframe_weeks numeric;
