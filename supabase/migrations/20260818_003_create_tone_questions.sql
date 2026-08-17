-- Milestone 2, Step 1 of Tone Test development. Applied 18 August 2026.
-- Creates the table holding each Tone Test's role questions, including its risk gate questions.
-- Adds no columns to existing tables and changes no existing behaviour.
-- Reversible with: drop table public.tone_questions;

-- One row per question. Three kinds, distinguished by question_type:
--   rating  a 1 to 5 agreement statement, feeds the Content Score
--   open    free text, read but never scored
--   gate    one of the six fixed risk gates, answered Pass, Concern or Fail
--
-- Gate identity lives here rather than in a separate table. Which gates exist
-- and which are critical is a fixed platform fact under the settled product
-- definition, not a per-study setting, so a second table carrying one row per
-- study per gate would hold nothing that varies. Keeping gate_key on the
-- question also keeps it attached to the thing a response points at.
create table if not exists public.tone_questions (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies(id) on delete cascade,
  role_key text not null
    check (role_key in ('audience', 'agency', 'editor')),
  question_type text not null
    check (question_type in ('rating', 'open', 'gate')),
  question_text text not null default '',
  gate_key text
    check (gate_key is null or gate_key in (
      'policy_accuracy',
      'safety_risk',
      'privacy_consent',
      'harm_blame_stigma',
      'operational_promise',
      'accessibility_readability'
    )),
  gate_critical boolean not null default false,
  required boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- A gate question must name its gate. Nothing else may.
  constraint tone_questions_gate_key_matches_type check (
    (question_type = 'gate' and gate_key is not null)
    or (question_type <> 'gate' and gate_key is null)
  ),

  -- Only a gate question can be critical.
  constraint tone_questions_critical_only_on_gates check (
    gate_critical = false or question_type = 'gate'
  ),

  -- Seeding a study's questions twice would otherwise silently double them.
  unique (study_id, role_key, question_type, display_order)
);

create index if not exists tone_questions_study_id_idx
  on public.tone_questions (study_id);
create index if not exists tone_questions_study_role_idx
  on public.tone_questions (study_id, role_key, display_order);

alter table public.tone_questions enable row level security;

-- Access rules copied from the tone_variants pattern, reusing the three
-- permission functions already in the database.

drop policy if exists "tone questions owner admin or published select" on public.tone_questions;
create policy "tone questions owner admin or published select" on public.tone_questions
for select to authenticated, anon
using (public.is_study_published(study_id) or public.is_study_owner(study_id) or public.is_admin());

drop policy if exists "tone questions owner admin all" on public.tone_questions;
create policy "tone questions owner admin all" on public.tone_questions
for all to authenticated
using (public.is_study_owner(study_id) or public.is_admin())
with check (public.is_study_owner(study_id) or public.is_admin());

-- No column restrictions are needed here, unlike tone_variants and
-- tone_test_settings. Every field on a question is something a participant
-- legitimately needs in order to answer it. There is no creator-private
-- field on this table.
