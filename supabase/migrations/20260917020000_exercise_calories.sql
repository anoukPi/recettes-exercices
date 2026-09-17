-- Migration 021 — durée + intensité par exercice loggé, pour en calculer la
-- dépense calorique individuelle (très variable d'un exercice à l'autre :
-- souplesse quasi nulle vs sprint maximal).

alter table activity_session_exercises add column if not exists duration_minutes numeric;
alter table activity_session_exercises add column if not exists intensity_level text;
alter table activity_session_exercises add column if not exists calories_kcal numeric;
