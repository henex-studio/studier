-- Milestone 4 Step 0, continued. The write entry point has to accept the
-- new answer type, since the participant runner is not allowed to touch
-- tone_responses directly (Milestone 3 Step 1).
--
-- This replaces the six-argument version created in Milestone 3 Step 1
-- (20260826_010) with a seven-argument version. The old signature is
-- dropped in the same migration rather than left alongside the new one:
-- Postgres treats a dropped-then-recreated function with an extra
-- default-valued parameter as a second, ambiguous overload if the old one
-- is not removed, which breaks every existing six-argument call.

drop function if exists public.submit_tone_response(uuid, text, uuid, uuid, smallint, text);

create or replace function public.submit_tone_response(
  p_study_id uuid,
  p_participant_id text,
  p_question_id uuid,
  p_variant_id uuid default null::uuid,
  p_rating_value smallint default null::smallint,
  p_text_value text default null::text,
  p_not_applicable boolean default false
)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_session_id uuid;
  v_question public.tone_questions%rowtype;
  v_text text;
  v_rating smallint;
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

  -- Only a rating question can be not applicable. An open text question
  -- that does not apply is simply left blank, and open questions are not
  -- required, so it needs no separate way of saying so.
  if p_not_applicable and v_question.question_type <> 'rating' then
    raise exception 'Only a rating question can be marked not applicable.';
  end if;

  -- A not applicable answer carries no value. Clearing both here rather
  -- than trusting the caller means a stale rating cannot survive a
  -- participant changing their mind to "not applicable" on second thought.
  if p_not_applicable then
    v_rating := null;
    v_text := null;
  else
    v_rating := p_rating_value;
    v_text := nullif(trim(coalesce(p_text_value, '')), '');
  end if;

  insert into public.tone_responses (
    session_id, study_id, question_id, variant_id, rating_value, text_value, not_applicable
  )
  values (
    v_session_id, p_study_id, p_question_id, p_variant_id,
    v_rating, v_text, coalesce(p_not_applicable, false)
  )
  on conflict (session_id, question_id, coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid))
  do update set
    rating_value = excluded.rating_value,
    text_value = excluded.text_value,
    not_applicable = excluded.not_applicable,
    updated_at = now();
end;
$function$;

revoke all on function public.submit_tone_response(uuid, text, uuid, uuid, smallint, text, boolean) from public;
grant execute on function public.submit_tone_response(uuid, text, uuid, uuid, smallint, text, boolean) to anon, authenticated;
