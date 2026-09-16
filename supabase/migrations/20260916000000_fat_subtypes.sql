-- Migration 018 — détail des acides gras (saturés, mono/poly-insaturés)

alter table ingredient_nutrition add column if not exists fat_saturated_g numeric;
alter table ingredient_nutrition add column if not exists fat_monounsaturated_g numeric;
alter table ingredient_nutrition add column if not exists fat_polyunsaturated_g numeric;
