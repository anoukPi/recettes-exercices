-- Migration 006 — ajoute "pièce" comme synonyme de "unité" dans les mesures

insert into reference_items (type, name)
values ('unit', 'pièce')
on conflict (type, name) do nothing;
