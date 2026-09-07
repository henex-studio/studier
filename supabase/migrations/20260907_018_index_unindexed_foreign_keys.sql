-- 018. Add a covering index to every foreign key that lacked one.
--
-- Covers audit finding A4.
--
-- A foreign key without an index on its own side makes the database read the
-- whole child table whenever it needs to find rows pointing at a parent, and
-- whenever a parent row is deleted or updated. Deleting a study currently
-- cascades into ten tables, so this is the operation that feels it first.
--
-- Ten keys had no index. The names follow the existing convention in this
-- database, <table>_<column>_idx.
--
-- This changes no behaviour and no access rule. It is safe to run again.

create index if not exists studies_owner_id_idx on public.studies (owner_id);
create index if not exists study_tasks_study_id_idx on public.study_tasks (study_id);
create index if not exists study_trees_study_id_idx on public.study_trees (study_id);
create index if not exists task_responses_task_id_idx on public.task_responses (task_id);
create index if not exists tone_gate_responses_question_id_idx on public.tone_gate_responses (question_id);
create index if not exists tone_gate_responses_variant_id_idx on public.tone_gate_responses (variant_id);
create index if not exists tone_responses_question_id_idx on public.tone_responses (question_id);
create index if not exists tone_responses_variant_id_idx on public.tone_responses (variant_id);
create index if not exists tone_sessions_assigned_variant_id_idx on public.tone_sessions (assigned_variant_id);
create index if not exists tone_sessions_preferred_variant_id_idx on public.tone_sessions (preferred_variant_id);

-- Not done here, deliberately. The advisor also reports three indexes as
-- never used: studies_expires_at_idx, tone_variants_study_id_idx and
-- feedback_created. On a database holding four studies with effectively no
-- query traffic, "never used" says nothing about whether an index is
-- worthwhile. It says the feature that would use it has not been exercised
-- yet. Dropping them on that evidence would be reading a statistic that has
-- not had a chance to mean anything. Revisit once real traffic exists.

do $checks$
declare missing integer;
begin
  select count(*) into missing
  from pg_constraint c
  where c.contype = 'f'
    and c.connamespace = 'public'::regnamespace
    and not exists (
      select 1 from pg_index i
      where i.indrelid = c.conrelid
        and (i.indkey::smallint[])[0:array_length(c.conkey,1)-1] @> c.conkey
        and array_length(c.conkey,1) = array_length((i.indkey::smallint[])[0:array_length(c.conkey,1)-1],1)
    );

  if missing <> 0 then
    raise exception '% foreign key(s) still have no covering index.', missing;
  end if;

  raise notice 'Every foreign key in public now has a covering index.';
end
$checks$;
