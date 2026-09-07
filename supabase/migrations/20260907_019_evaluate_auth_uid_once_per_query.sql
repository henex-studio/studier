-- 019. Make nine policies evaluate auth.uid() once per query instead of once
-- per row.
--
-- Covers audit finding A5.
--
-- A policy expression naming auth.uid() directly is re-evaluated for every row
-- the query examines. Wrapping it as (select auth.uid()) lets the planner
-- evaluate it once and reuse the result, because the function is stable within
-- a statement. The rule allows and denies exactly the same rows either way.
-- Two policies on `feedback` were already written this way; these nine were
-- not.
--
--   final_responses       Owners and admins can delete final responses
--   participant_sessions  Owners and admins can delete participant sessions
--   profiles              profiles own display name update
--   profiles              profiles own or admin select
--   studies               studies owner insert
--   studies               studies owner or admin delete
--   studies               studies owner or admin select
--   studies               studies owner or admin update
--   task_responses        Owners and admins can delete task responses
--
-- The policies are rebuilt from their own stored definitions rather than
-- retyped. Retyping nine access rules to insert one wrapper in each is nine
-- chances to widen or narrow who can read what, and an access rule that is
-- wrong in either direction does not announce itself: too tight locks an
-- account out of its own data, too loose exposes data across accounts, and the
-- interface looks much the same. The substitution below touches auth.uid() and
-- nothing else, and asserts the count.
--
-- Worth being honest about the value. With four studies and no traffic, the
-- performance gain today is nil. This is worth doing before real participants
-- arrive, not because it speeds anything up now, but because it is much
-- cheaper to change nine policies while nobody depends on them.

do $m$
declare
  p record;
  new_qual text;
  new_check text;
  stmt text;
  changed integer := 0;
begin
  for p in
    select schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (coalesce(qual, '') || coalesce(with_check, '')) ~ 'auth\.uid\(\)'
      and (coalesce(qual, '') || coalesce(with_check, '')) !~* 'select\s+auth\.uid'
    order by tablename, policyname
  loop
    new_qual  := regexp_replace(p.qual,       'auth\.uid\(\)', '(select auth.uid())', 'g');
    new_check := regexp_replace(p.with_check, 'auth\.uid\(\)', '(select auth.uid())', 'g');

    if coalesce(new_qual, '') = coalesce(p.qual, '')
       and coalesce(new_check, '') = coalesce(p.with_check, '') then
      raise exception 'Substitution changed nothing in policy % on %. Aborting.', p.policyname, p.tablename;
    end if;

    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);

    stmt := format('create policy %I on %I.%I as %s for %s to %s',
                   p.policyname, p.schemaname, p.tablename,
                   p.permissive, p.cmd, array_to_string(p.roles, ', '));

    if new_qual is not null then
      stmt := stmt || format(' using (%s)', new_qual);
    end if;

    if new_check is not null then
      stmt := stmt || format(' with check (%s)', new_check);
    end if;

    execute stmt;
    changed := changed + 1;
  end loop;

  if changed <> 9 then
    raise exception 'Expected to rewrite 9 policies, rewrote %. Aborting.', changed;
  end if;

  raise notice 'Rewrote % policies to evaluate auth.uid() once per query.', changed;
end
$m$;

-- The drop and recreate above is the risky part: a policy that fails to come
-- back leaves a table with one rule fewer, which reads as working software
-- until someone cannot see their own data. The count is therefore checked
-- rather than assumed.
do $checks$
declare
  remaining integer;
  total integer;
  helpers integer;
begin
  select count(*) into remaining
  from pg_policies
  where schemaname = 'public'
    and (coalesce(qual, '') || coalesce(with_check, '')) ~ 'auth\.uid\(\)'
    and (coalesce(qual, '') || coalesce(with_check, '')) !~* 'select\s+auth\.uid';

  if remaining <> 0 then
    raise exception '% policy(ies) still re-evaluate auth.uid() per row.', remaining;
  end if;

  select count(*) into total from pg_policies where schemaname = 'public';
  if total <> 34 then
    raise exception 'Policy count changed from 34 to %. A policy was lost or duplicated.', total;
  end if;

  select count(*) into helpers
  from pg_policies
  where schemaname = 'public'
    and (coalesce(qual, '') || coalesce(with_check, '')) ~ 'is_admin|is_study_owner|is_study_published';

  if helpers <> 27 then
    raise exception 'Expected 27 policies calling the access control helpers, found %.', helpers;
  end if;

  raise notice 'Checks passed: 0 per-row evaluations, 34 policies total, 27 still calling the helpers.';
end
$checks$;
