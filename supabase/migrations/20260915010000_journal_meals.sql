-- Migration 005 — regrouper les entrées du carnet par repas

alter table journal_entries add column if not exists meal text not null default 'Autre';
