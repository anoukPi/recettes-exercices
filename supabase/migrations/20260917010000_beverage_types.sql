-- Migration 020 — types de boisson pour l'hydratation (café, thé, tisane, eau)

alter table water_entries add column if not exists beverage_type text not null default 'eau';
