-- Completes the fix begun in 007. Applied 26 August 2026.
--
-- Removing anonymous read access closed the leak but broke submission.
-- PostgreSQL requires the conflicting row to be visible through a SELECT
-- policy before INSERT ... ON CONFLICT DO UPDATE can take the update
-- path, and the test runner submits every answer with an upsert. A
-- participant who uses the Back button to revise an answer takes that
-- path, so this was ordinary use breaking, not an edge case. Column level
-- grants were tried first and do not satisfy the check either; it needs
-- table-wide select.
--
-- So submission moves behind these functions. Anonymous callers now hold
-- no direct privileges on the three response tables at all: they cannot
-- read, insert or update them, and reach them only through the entry
-- points below, which decide what may be written. This also closes the
-- overwrite risk, since an anonymous caller can no longer issue an
-- arbitrary UPDATE.
--
-- Same pattern as handle_new_user: security definer, empty search path,
-- every table reference fully qualified.
--
-- Tone Test should use this pattern from the start in Milestone 3 rather
-- than granting participants direct table access.

create or replace function public.submit_task_response(p_response jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_study_id uuid := nullif(p_response->>'study_id', '')::uuid;
  v_participant_id text := nullif(trim(coalesce(p_response->>'participant_id', '')), '');
  v_task_id uuid := nullif(p_response->>'task_id', '')::uuid;
begin
  if v_study_id is null or v_participant_id is null or v_task_id is null then
    raise exception 'study_id, participant_id and task_id are required.';
  end if;

  -- A study that is draft or closed accepts nothing. Same condition the
  -- old row level policy applied, kept identical so this changes who can
  -- write, not which studies are open.
  if not public.is_study_published(v_study_id) then
    raise exception 'This test is not accepting responses.';
  end if;

  insert into public.task_responses (
    study_id, participant_id, task_id, task_order, task_text, selected_path,
    skipped, target_path, target_paths, acceptable_paths, match_type, is_correct,
    first_click_path, click_history, depth, click_count, backtrack_count,
    hesitation_flag, time_seconds, submitted_at, updated_at
  )
  values (
    v_study_id, v_participant_id, v_task_id,
    nullif(p_response->>'task_order', '')::int,
    p_response->>'task_text',
    p_response->>'selected_path',
    coalesce(nullif(p_response->>'skipped', '')::boolean, false),
    p_response->>'target_path',
    p_response->'target_paths',
    p_response->'acceptable_paths',
    p_response->>'match_type',
    nullif(p_response->>'is_correct', '')::boolean,
    p_response->>'first_click_path',
    p_response->'click_history',
    nullif(p_response->>'depth', '')::int,
    nullif(p_response->>'click_count', '')::int,
    nullif(p_response->>'backtrack_count', '')::int,
    nullif(p_response->>'hesitation_flag', '')::boolean,
    nullif(p_response->>'time_seconds', '')::int,
    now(), now()
  )
  on conflict (study_id, participant_id, task_id) do update set
    task_order = excluded.task_order,
    task_text = excluded.task_text,
    selected_path = excluded.selected_path,
    skipped = excluded.skipped,
    target_path = excluded.target_path,
    target_paths = excluded.target_paths,
    acceptable_paths = excluded.acceptable_paths,
    match_type = excluded.match_type,
    is_correct = excluded.is_correct,
    first_click_path = excluded.first_click_path,
    click_history = excluded.click_history,
    depth = excluded.depth,
    click_count = excluded.click_count,
    backtrack_count = excluded.backtrack_count,
    hesitation_flag = excluded.hesitation_flag,
    time_seconds = excluded.time_seconds,
    updated_at = now();
end;
$$;

create or replace function public.submit_final_response(p_response jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_study_id uuid := nullif(p_response->>'study_id', '')::uuid;
  v_participant_id text := nullif(trim(coalesce(p_response->>'participant_id', '')), '');
begin
  if v_study_id is null or v_participant_id is null then
    raise exception 'study_id and participant_id are required.';
  end if;

  if not public.is_study_published(v_study_id) then
    raise exception 'This test is not accepting responses.';
  end if;

  insert into public.final_responses (
    study_id, participant_id, final_answers, submitted_at, updated_at
  )
  values (
    v_study_id, v_participant_id,
    coalesce(p_response->'final_answers', '{}'::jsonb),
    now(), now()
  )
  on conflict (study_id, participant_id) do update set
    final_answers = excluded.final_answers,
    updated_at = now();
end;
$$;

create or replace function public.upsert_participant_session(
  p_study_id uuid,
  p_participant_id text,
  p_completed boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_participant_id text := nullif(trim(coalesce(p_participant_id, '')), '');
begin
  if p_study_id is null or v_participant_id is null then
    raise exception 'study_id and participant_id are required.';
  end if;

  if not public.is_study_published(p_study_id) then
    raise exception 'This test is not accepting responses.';
  end if;

  insert into public.participant_sessions (
    study_id, participant_id, started_at, completed_at
  )
  values (
    p_study_id, v_participant_id, now(),
    case when p_completed then now() else null end
  )
  on conflict (study_id, participant_id) do update set
    -- started_at is never overwritten, so a revision does not rewrite when
    -- the participant actually began.
    completed_at = case when p_completed then now() else public.participant_sessions.completed_at end;
end;
$$;

revoke execute on function public.submit_task_response(jsonb) from public;
revoke execute on function public.submit_final_response(jsonb) from public;
revoke execute on function public.upsert_participant_session(uuid, text, boolean) from public;

grant execute on function public.submit_task_response(jsonb) to anon, authenticated;
grant execute on function public.submit_final_response(jsonb) to anon, authenticated;
grant execute on function public.upsert_participant_session(uuid, text, boolean) to anon, authenticated;

-- With the entry points in place, anonymous callers lose every direct
-- privilege on the response tables.
drop policy if exists "task responses public submit for published studies" on public.task_responses;
drop policy if exists "task responses public update for published studies" on public.task_responses;
drop policy if exists "final responses public submit for published studies" on public.final_responses;
drop policy if exists "final responses public update for published studies" on public.final_responses;
drop policy if exists "sessions public submit for published studies" on public.participant_sessions;
drop policy if exists "sessions public update for published studies" on public.participant_sessions;

revoke all on public.task_responses from anon;
revoke all on public.final_responses from anon;
revoke all on public.participant_sessions from anon;
