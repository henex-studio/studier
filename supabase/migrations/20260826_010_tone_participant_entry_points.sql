-- Milestone 3, Step 1, second half. Applied 26 August 2026.
-- The only way an anonymous participant reaches the tables in 009.
--
-- Each function checks the study is published before doing anything, and
-- each scopes every read and write to one participant's own session.
--
-- Note on ordering: tone_session_id_for_writing is defined first here,
-- although when originally applied it went in a third migration because
-- the submit functions were written before their shared helper. Order
-- corrected in this file so it runs cleanly from scratch.

-- The check every write shares: the study must be published, the session
-- must exist, and it must not already be finished. Written once rather
-- than three times, so the submit functions cannot drift apart on what
-- they allow.
--
-- Not granted to anyone. It is only called from the functions below,
-- which run as their owner.
create or replace function public.tone_session_id_for_writing(
  p_study_id uuid,
  p_participant_id text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_participant_id text := nullif(trim(coalesce(p_participant_id, '')), '');
  v_session public.tone_sessions%rowtype;
begin
  if p_study_id is null or v_participant_id is null then
    raise exception 'study_id and participant_id are required.';
  end if;

  if not public.is_study_published(p_study_id) then
    raise exception 'This test is not accepting responses.';
  end if;

  select * into v_session
  from public.tone_sessions
  where study_id = p_study_id and participant_id = v_participant_id;

  if not found then
    raise exception 'Choose a role before answering.';
  end if;

  if v_session.completed_at is not null then
    raise exception 'This response has already been submitted.';
  end if;

  return v_session.id;
end;
$$;

revoke execute on function public.tone_session_id_for_writing(uuid, text) from public, anon, authenticated;

-- Returns one session as json, or null. Scoped to the study and
-- participant identifier supplied, so a caller can only ever see the
-- session they already hold the identifier for, and never a list.
create or replace function public.get_tone_session(
  p_study_id uuid,
  p_participant_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_participant_id text := nullif(trim(coalesce(p_participant_id, '')), '');
  v_session public.tone_sessions%rowtype;
begin
  if p_study_id is null or v_participant_id is null then
    return null;
  end if;

  if not public.is_study_published(p_study_id) then
    return null;
  end if;

  select * into v_session
  from public.tone_sessions
  where study_id = p_study_id and participant_id = v_participant_id;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'id', v_session.id,
    'selected_role', v_session.selected_role,
    'assigned_variant_id', v_session.assigned_variant_id,
    'variant_order_json', v_session.variant_order_json,
    'preferred_variant_id', v_session.preferred_variant_id,
    'started_at', v_session.started_at,
    'completed_at', v_session.completed_at,
    'answer_count', (
      select count(*) from public.tone_responses where session_id = v_session.id
    ) + (
      select count(*) from public.tone_gate_responses where session_id = v_session.id
    )
  );
end;
$$;

-- Creates the session on first use, or returns the existing one.
--
-- Variant assignment happens here, once, and is then stored. Doing it in
-- the browser would mean a refresh could change the wording a participant
-- is looking at.
--
-- The role locks once answering starts. Before any answer exists a
-- participant may change their mind freely; afterwards the requested role
-- is ignored rather than rejected, because a participant who reopens the
-- link should carry on, not hit an error.
create or replace function public.start_tone_session(
  p_study_id uuid,
  p_participant_id text,
  p_role text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_participant_id text := nullif(trim(coalesce(p_participant_id, '')), '');
  v_role text := nullif(trim(lower(coalesce(p_role, ''))), '');
  v_settings public.tone_test_settings%rowtype;
  v_active jsonb;
  v_existing public.tone_sessions%rowtype;
  v_answers int;
  v_assigned uuid;
  v_order jsonb;
begin
  if p_study_id is null or v_participant_id is null or v_role is null then
    raise exception 'study_id, participant_id and role are required.';
  end if;

  if v_role not in ('audience', 'agency', 'editor') then
    raise exception 'Unknown role.';
  end if;

  if not public.is_study_published(p_study_id) then
    raise exception 'This test is not accepting responses.';
  end if;

  select * into v_settings
  from public.tone_test_settings
  where study_id = p_study_id;

  if not found then
    raise exception 'This test is not set up yet.';
  end if;

  -- A role the creator switched off must not be answerable, even by
  -- someone constructing the request by hand.
  v_active := coalesce(v_settings.active_roles_json, '{}'::jsonb);
  if coalesce((v_active->>v_role)::boolean, true) is not true then
    raise exception 'That role is not active for this test.';
  end if;

  select * into v_existing
  from public.tone_sessions
  where study_id = p_study_id and participant_id = v_participant_id;

  if found then
    select count(*) into v_answers
    from public.tone_responses where session_id = v_existing.id;

    if v_answers = 0 then
      select count(*) into v_answers
      from public.tone_gate_responses where session_id = v_existing.id;
    end if;

    if v_answers = 0 and v_existing.selected_role is distinct from v_role then
      update public.tone_sessions
         set selected_role = v_role
       where id = v_existing.id;
    end if;

    return public.get_tone_session(p_study_id, v_participant_id);
  end if;

  -- First visit. Decide what this participant sees, once.
  if coalesce(v_settings.variant_mode, 'single_random') = 'compare_all' then
    select jsonb_agg(id order by ord)
      into v_order
    from (
      select id, random() as ord
      from public.tone_variants
      where study_id = p_study_id
    ) shuffled;
  else
    select id into v_assigned
    from public.tone_variants
    where study_id = p_study_id
    order by random()
    limit 1;
  end if;

  insert into public.tone_sessions (
    study_id, participant_id, selected_role, assigned_variant_id, variant_order_json
  )
  values (p_study_id, v_participant_id, v_role, v_assigned, v_order)
  on conflict (study_id, participant_id) do nothing;

  return public.get_tone_session(p_study_id, v_participant_id);
end;
$$;

-- Saves one rating or open answer. Answering the same question again
-- replaces the previous answer.
create or replace function public.submit_tone_response(
  p_study_id uuid,
  p_participant_id text,
  p_question_id uuid,
  p_variant_id uuid default null,
  p_rating_value smallint default null,
  p_text_value text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session_id uuid;
  v_question public.tone_questions%rowtype;
begin
  v_session_id := public.tone_session_id_for_writing(p_study_id, p_participant_id);

  select * into v_question
  from public.tone_questions
  where id = p_question_id and study_id = p_study_id;

  if not found then
    raise exception 'Unknown question for this test.';
  end if;

  if v_question.question_type = 'gate' then
    raise exception 'Use submit_tone_gate_response for a risk gate question.';
  end if;

  insert into public.tone_responses (
    session_id, study_id, question_id, variant_id, rating_value, text_value
  )
  values (
    v_session_id, p_study_id, p_question_id, p_variant_id,
    p_rating_value, nullif(trim(coalesce(p_text_value, '')), '')
  )
  on conflict (session_id, question_id, coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid))
  do update set
    rating_value = excluded.rating_value,
    text_value = excluded.text_value,
    updated_at = now();
end;
$$;

-- Saves one risk gate answer. gate_key is read from the question rather
-- than taken from the caller, so a participant cannot record an answer
-- against a gate the question does not belong to.
create or replace function public.submit_tone_gate_response(
  p_study_id uuid,
  p_participant_id text,
  p_question_id uuid,
  p_gate_status text,
  p_variant_id uuid default null,
  p_comment text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session_id uuid;
  v_question public.tone_questions%rowtype;
  v_status text := nullif(trim(lower(coalesce(p_gate_status, ''))), '');
begin
  v_session_id := public.tone_session_id_for_writing(p_study_id, p_participant_id);

  if v_status not in ('pass', 'concern', 'fail') then
    raise exception 'Gate status must be pass, concern or fail.';
  end if;

  select * into v_question
  from public.tone_questions
  where id = p_question_id and study_id = p_study_id and question_type = 'gate';

  if not found then
    raise exception 'Unknown risk gate question for this test.';
  end if;

  insert into public.tone_gate_responses (
    session_id, study_id, question_id, gate_key, variant_id, gate_status, comment
  )
  values (
    v_session_id, p_study_id, p_question_id, v_question.gate_key, p_variant_id,
    v_status, nullif(trim(coalesce(p_comment, '')), '')
  )
  on conflict (session_id, question_id, coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid))
  do update set
    gate_status = excluded.gate_status,
    comment = excluded.comment,
    updated_at = now();
end;
$$;

-- Marks the session finished, and records the preferred variant if the
-- test compares all of them.
create or replace function public.complete_tone_session(
  p_study_id uuid,
  p_participant_id text,
  p_preferred_variant_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session_id uuid;
begin
  v_session_id := public.tone_session_id_for_writing(p_study_id, p_participant_id);

  update public.tone_sessions
     set completed_at = now(),
         preferred_variant_id = coalesce(p_preferred_variant_id, preferred_variant_id)
   where id = v_session_id;
end;
$$;

revoke execute on function public.get_tone_session(uuid, text) from public;
revoke execute on function public.start_tone_session(uuid, text, text) from public;
revoke execute on function public.submit_tone_response(uuid, text, uuid, uuid, smallint, text) from public;
revoke execute on function public.submit_tone_gate_response(uuid, text, uuid, text, uuid, text) from public;
revoke execute on function public.complete_tone_session(uuid, text, uuid) from public;

grant execute on function public.get_tone_session(uuid, text) to anon, authenticated;
grant execute on function public.start_tone_session(uuid, text, text) to anon, authenticated;
grant execute on function public.submit_tone_response(uuid, text, uuid, uuid, smallint, text) to anon, authenticated;
grant execute on function public.submit_tone_gate_response(uuid, text, uuid, text, uuid, text) to anon, authenticated;
grant execute on function public.complete_tone_session(uuid, text, uuid) to anon, authenticated;
