-- Migration 013 — sports pratiqués, en plus du niveau d'activité général

alter table profile add column if not exists sports text[] not null default '{}';
