-- Aegis — migration 0001: taste preferences
-- Adds two OPTIONAL, best-effort taste fields to profiles. These are NOT safety
-- constraints — only `allergens` is enforced by the deterministic guardrail.
-- Additive + idempotent + non-destructive: safe to run on the live DB. No new
-- RLS policies needed — the existing per-row profiles policies cover new columns.
--
-- Apply in the Supabase SQL Editor (or via the session pooler).

alter table public.profiles
  add column if not exists favorite_cuisines text[] not null default '{}',
  add column if not exists disliked_foods    text[] not null default '{}';
