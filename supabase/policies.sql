-- Aegis — Row-Level Security policies
-- The real access-control layer: every table is locked so a user can only ever
-- touch their OWN data, enforced by Postgres via auth.uid(). This is deny-by-
-- default — with RLS on and no matching policy, a query returns nothing.
-- (This maps to CyberGen's access-control product, Rego.)
-- Run this AFTER schema.sql.

alter table public.profiles      enable row level security;
alter table public.meal_plans    enable row level security;
alter table public.meals         enable row level security;
alter table public.ingredients   enable row level security;
alter table public.safety_events enable row level security;

-- profiles: a user reads/inserts/updates only their own row (id = auth uid)
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- meal_plans: owned directly via user_id
drop policy if exists meal_plans_all_own on public.meal_plans;
create policy meal_plans_all_own on public.meal_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- meals: owned via the parent plan
drop policy if exists meals_all_own on public.meals;
create policy meals_all_own on public.meals
  for all
  using (exists (
    select 1 from public.meal_plans p
    where p.id = meals.plan_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.meal_plans p
    where p.id = meals.plan_id and p.user_id = auth.uid()
  ));

-- ingredients: owned via meal → plan
drop policy if exists ingredients_all_own on public.ingredients;
create policy ingredients_all_own on public.ingredients
  for all
  using (exists (
    select 1 from public.meals m
    join public.meal_plans p on p.id = m.plan_id
    where m.id = ingredients.meal_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.meals m
    join public.meal_plans p on p.id = m.plan_id
    where m.id = ingredients.meal_id and p.user_id = auth.uid()
  ));

-- safety_events: a user reads and inserts only their own audit rows
drop policy if exists safety_events_select_own on public.safety_events;
create policy safety_events_select_own on public.safety_events
  for select using (auth.uid() = user_id);

drop policy if exists safety_events_insert_own on public.safety_events;
create policy safety_events_insert_own on public.safety_events
  for insert with check (auth.uid() = user_id);
