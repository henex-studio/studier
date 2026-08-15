-- Step 2 of Tone Test development. Applied 15 August 2026.
-- Creates the two tables a Tone Test needs before anything can be built in the interface.
-- Adds no columns to existing tables and changes no existing behaviour.
-- Reversible with: drop table public.tone_variants; drop table public.tone_test_settings;

-- One row per Tone Test. Holds the setup the creator fills in.
create table if not exists public.tone_test_settings (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies(id) on delete cascade,
  scenario text not null default '',
  content_goal text not null default '',
  sensitivity_level text,
  variant_mode text not null default 'single_random'
    check (variant_mode in ('single_random', 'compare_all')),
  content_score_weights_json jsonb not null
    default '{"audience_evidence":40,"agency_assurance":35,"content_quality":25}'::jsonb,
  active_roles_json jsonb not null
    default '{"audience":true,"agency":true,"editor":true}'::jsonb,
  evidence_confidence_settings_json jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (study_id)
);

-- One row per wording variant. Two to four per study, enforced in the interface.
create table if not exists public.tone_variants (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies(id) on delete cascade,
  label text not null default '',
  variant_text text not null default '',
  internal_note text,
  display_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists tone_test_settings_study_id_idx
  on public.tone_test_settings (study_id);
create index if not exists tone_variants_study_id_idx
  on public.tone_variants (study_id);
create index if not exists tone_variants_study_order_idx
  on public.tone_variants (study_id, display_order);

alter table public.tone_test_settings enable row level security;
alter table public.tone_variants enable row level security;

-- Access rules copied from the existing study_tasks pattern, reusing the three
-- permission functions already in the database.

drop policy if exists "tone settings owner admin or published select" on public.tone_test_settings;
create policy "tone settings owner admin or published select" on public.tone_test_settings
for select to authenticated, anon
using (public.is_study_published(study_id) or public.is_study_owner(study_id) or public.is_admin());

drop policy if exists "tone settings owner admin all" on public.tone_test_settings;
create policy "tone settings owner admin all" on public.tone_test_settings
for all to authenticated
using (public.is_study_owner(study_id) or public.is_admin())
with check (public.is_study_owner(study_id) or public.is_admin());

drop policy if exists "tone variants owner admin or published select" on public.tone_variants;
create policy "tone variants owner admin or published select" on public.tone_variants
for select to authenticated, anon
using (public.is_study_published(study_id) or public.is_study_owner(study_id) or public.is_admin());

drop policy if exists "tone variants owner admin all" on public.tone_variants;
create policy "tone variants owner admin all" on public.tone_variants
for all to authenticated
using (public.is_study_owner(study_id) or public.is_admin())
with check (public.is_study_owner(study_id) or public.is_admin());

-- Column restrictions for anonymous participants.
-- Row-level rules control which rows are visible, not which fields. Two fields
-- must never reach a participant: the creator's private note on a variant, and
-- the scoring weights. Both are creator-facing only. Postgres column grants are
-- the mechanism for this and sit alongside the row rules above.

revoke all on public.tone_variants from anon;
grant select (id, study_id, label, variant_text, display_order, created_at, updated_at)
  on public.tone_variants to anon;

revoke all on public.tone_test_settings from anon;
grant select (id, study_id, scenario, content_goal, sensitivity_level, variant_mode, active_roles_json, created_at, updated_at)
  on public.tone_test_settings to anon;
