-- Milestone 3, Step 1, first half. Applied 26 August 2026.
-- Participant sessions and responses for Tone Test.
--
-- Anonymous participants get no privilege of any kind on these tables.
-- They read and write only through the entry points in migration 010.
-- This follows the pattern arrived at earlier the same day, after
-- anonymous callers were found able to read and overwrite every Tree Test
-- response, and it is applied here from the start rather than retrofitted.
--
-- Reversible with:
--   drop table public.tone_gate_responses, public.tone_responses, public.tone_sessions;

-- One row per participant per test. Also carries the two things that must
-- be decided once and then never change for that participant: which
-- variant they were assigned, or what order they see all variants in.
-- Recomputing either on each page load would mean a refresh changes the
-- wording under them, which quietly ruins the data.
create table if not exists public.tone_sessions (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies(id) on delete cascade,
  participant_id text not null,
  selected_role text not null
    check (selected_role in ('audience', 'agency', 'editor')),
  assigned_variant_id uuid references public.tone_variants(id) on delete set null,
  variant_order_json jsonb,
  preferred_variant_id uuid references public.tone_variants(id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (study_id, participant_id)
);

-- One row per answered rating or open question.
--
-- variant_id is nullable on purpose. In single variant mode every answer
-- refers to the assigned variant. In compare all mode a rating clearly
-- belongs to one variant, but whether an open question is asked once or
-- once per variant is not settled by the specification. Allowing null
-- supports both without forcing that decision now; Step 4 decides what the
-- interface actually asks.
create table if not exists public.tone_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.tone_sessions(id) on delete cascade,
  study_id uuid not null references public.studies(id) on delete cascade,
  question_id uuid not null references public.tone_questions(id) on delete cascade,
  variant_id uuid references public.tone_variants(id) on delete cascade,
  rating_value smallint check (rating_value between 1 and 5),
  text_value text,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- An answer that holds neither a rating nor text is not an answer.
  constraint tone_responses_has_a_value check (
    rating_value is not null or nullif(trim(coalesce(text_value, '')), '') is not null
  )
);

-- Answering the same question twice replaces the first answer rather than
-- adding a second. Expressed as an index rather than a constraint because
-- a null variant_id must collide with another null, which a plain unique
-- constraint does not do.
create unique index if not exists tone_responses_unique_answer
  on public.tone_responses (
    session_id,
    question_id,
    coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

-- Gate answers are kept apart from ratings and open text because they are
-- a different kind of judgement, read under different rules: one Fail on a
-- critical gate overrides everything else at scoring time.
--
-- gate_key is copied here rather than only joined from tone_questions, so
-- Milestone 4 can read gate status without a join, and so a gate answer
-- still says which gate it was if the question wording is later edited.
create table if not exists public.tone_gate_responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.tone_sessions(id) on delete cascade,
  study_id uuid not null references public.studies(id) on delete cascade,
  question_id uuid not null references public.tone_questions(id) on delete cascade,
  gate_key text not null
    check (gate_key in (
      'policy_accuracy', 'safety_risk', 'privacy_consent',
      'harm_blame_stigma', 'operational_promise', 'accessibility_readability'
    )),
  variant_id uuid references public.tone_variants(id) on delete cascade,
  gate_status text not null
    check (gate_status in ('pass', 'concern', 'fail')),
  comment text,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists tone_gate_responses_unique_answer
  on public.tone_gate_responses (
    session_id,
    question_id,
    coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create index if not exists tone_sessions_study_idx on public.tone_sessions (study_id);
create index if not exists tone_responses_study_idx on public.tone_responses (study_id);
create index if not exists tone_responses_session_idx on public.tone_responses (session_id);
create index if not exists tone_gate_responses_study_idx on public.tone_gate_responses (study_id);
create index if not exists tone_gate_responses_session_idx on public.tone_gate_responses (session_id);

alter table public.tone_sessions enable row level security;
alter table public.tone_responses enable row level security;
alter table public.tone_gate_responses enable row level security;

-- Reading is for the study owner and administrators, signed in. There is
-- deliberately no anonymous policy of any kind: participants reach their
-- own session through get_tone_session, which returns one row and never
-- anyone else's.
drop policy if exists "tone sessions owner admin select" on public.tone_sessions;
create policy "tone sessions owner admin select" on public.tone_sessions
for select to authenticated
using (public.is_study_owner(study_id) or public.is_admin());

drop policy if exists "tone sessions owner admin delete" on public.tone_sessions;
create policy "tone sessions owner admin delete" on public.tone_sessions
for delete to authenticated
using (public.is_study_owner(study_id) or public.is_admin());

drop policy if exists "tone responses owner admin select" on public.tone_responses;
create policy "tone responses owner admin select" on public.tone_responses
for select to authenticated
using (public.is_study_owner(study_id) or public.is_admin());

drop policy if exists "tone responses owner admin delete" on public.tone_responses;
create policy "tone responses owner admin delete" on public.tone_responses
for delete to authenticated
using (public.is_study_owner(study_id) or public.is_admin());

drop policy if exists "tone gate responses owner admin select" on public.tone_gate_responses;
create policy "tone gate responses owner admin select" on public.tone_gate_responses
for select to authenticated
using (public.is_study_owner(study_id) or public.is_admin());

drop policy if exists "tone gate responses owner admin delete" on public.tone_gate_responses;
create policy "tone gate responses owner admin delete" on public.tone_gate_responses
for delete to authenticated
using (public.is_study_owner(study_id) or public.is_admin());

revoke all on public.tone_sessions from anon;
revoke all on public.tone_responses from anon;
revoke all on public.tone_gate_responses from anon;
