-- Migration 004 — carnet alimentaire + cache des valeurs nutritionnelles (USDA)

create table if not exists ingredient_nutrition (
  id uuid primary key default gen_random_uuid(),
  reference_item_id uuid not null references reference_items(id) on delete cascade,
  fdc_id integer,
  fdc_description text,
  calories_kcal numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  fiber_g numeric,
  sugar_g numeric,
  sodium_mg numeric,
  calcium_mg numeric,
  iron_mg numeric,
  potassium_mg numeric,
  magnesium_mg numeric,
  zinc_mg numeric,
  vitamin_a_mcg numeric,
  vitamin_c_mg numeric,
  vitamin_d_mcg numeric,
  vitamin_e_mg numeric,
  vitamin_b12_mcg numeric,
  updated_at timestamptz not null default now(),
  unique (reference_item_id)
);

create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null,
  kind text not null check (kind in ('ingredient', 'recipe')),
  reference_item_id uuid references reference_items(id) on delete set null,
  recipe_id uuid references recipes(id) on delete set null,
  label text not null,
  quantity numeric not null default 1,
  unit text,
  created_at timestamptz not null default now()
);

create index if not exists journal_entries_date_idx on journal_entries (entry_date);

alter table ingredient_nutrition enable row level security;
alter table journal_entries enable row level security;

drop policy if exists "Allow all on ingredient_nutrition" on ingredient_nutrition;
create policy "Allow all on ingredient_nutrition" on ingredient_nutrition for all using (true) with check (true);

drop policy if exists "Allow all on journal_entries" on journal_entries;
create policy "Allow all on journal_entries" on journal_entries for all using (true) with check (true);
