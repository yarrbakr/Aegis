-- Aegis — database schema
-- Data model: profiles → meal_plans → meals → ingredients, plus a safety_events
-- audit log. Relational on purpose (that's the Postgres justification).
-- Run this in the Supabase SQL Editor first, then policies.sql.

create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- 1) profiles — one row per authenticated user
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  display_name      text,
  diet_type         text        not null default 'omnivore',   -- omnivore | vegetarian | vegan | keto | ...
  allergens         text[]      not null default '{}',          -- the user's declared allergens (ENFORCED by the guardrail)
  favorite_cuisines text[]      not null default '{}',          -- taste hint only (best-effort, NOT a safety constraint)
  disliked_foods    text[]      not null default '{}',          -- taste hint only (best-effort, NOT a safety constraint)
  weekly_budget     numeric(10,2),
  num_people        int         not null default 1,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
-- NB: if this table already exists from an earlier run, `create table if not
-- exists` will NOT add the taste columns — run supabase/migrations/0001_taste_preferences.sql.

-- 2) meal_plans — a user has many plans
create table if not exists public.meal_plans (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  week_start date,
  total_cost numeric(10,2),
  status     text        not null default 'ready',  -- generating | ready | failed
  created_at timestamptz not null default now()
);

-- 3) meals — a plan has many meals
create table if not exists public.meals (
  id            uuid        primary key default gen_random_uuid(),
  plan_id       uuid        not null references public.meal_plans(id) on delete cascade,
  day_of_week   int         not null check (day_of_week between 0 and 6),
  meal_type     text        not null,               -- breakfast | lunch | dinner
  name          text        not null,
  description   text,
  cost          numeric(10,2),
  calories      int,
  protein_g     int,
  carbs_g       int,
  fat_g         int,
  safety_status text        not null default 'passed',  -- passed | blocked_regenerated
  created_at    timestamptz not null default now()
);

-- 4) ingredients — a meal has many ingredients (this is what the guardrail scans)
create table if not exists public.ingredients (
  id            uuid   primary key default gen_random_uuid(),
  meal_id       uuid   not null references public.meals(id) on delete cascade,
  name          text   not null,
  quantity      text,
  allergen_tags text[] not null default '{}'
);

-- 5) safety_events — audit log that powers the Safety Dashboard + eval
create table if not exists public.safety_events (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  plan_id    uuid        references public.meal_plans(id) on delete set null,
  event_type text        not null,   -- meal_passed | meal_blocked | injection_detected
  allergen   text,
  detail     text,
  created_at timestamptz not null default now()
);

-- Indexes on the foreign keys we filter/join on
create index if not exists idx_meal_plans_user    on public.meal_plans(user_id);
create index if not exists idx_meals_plan          on public.meals(plan_id);
create index if not exists idx_ingredients_meal    on public.ingredients(meal_id);
create index if not exists idx_safety_events_user  on public.safety_events(user_id);

-- Keep profiles.updated_at fresh on every update
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row when a new auth user signs up (runs as definer, bypasses RLS)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Table privileges for the logged-in role (RLS still gates which *rows* are visible).
-- Included explicitly so the schema works regardless of the project's
-- "auto-expose new tables" setting. `anon` gets nothing — you must be logged in.
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
