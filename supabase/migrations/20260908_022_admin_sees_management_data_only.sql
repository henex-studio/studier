-- 022. An administrator stops being able to read other accounts' content.
--
-- Operator's decision, 8 September 2026.
--
-- WHAT WAS TRUE BEFORE. is_admin() appeared in 27 policies across 13
-- tables, five of them FOR ALL. An administrator could read, and in five
-- cases edit, every other account's navigation tree, tasks, questions,
-- wording variants, scoring configuration and participant answers.
--
-- Measured rather than assumed, immediately before this ran. Impersonating
-- an administrator and reading one study belonging to an ordinary user
-- returned: the study row, its tree, 10 tasks, 3 questions, 251 participant
-- answers and 25 sessions.
--
-- WHY IT MATTERS HERE MORE THAN IT WOULD ELSEWHERE. A tone test exists to
-- check sensitive wording before it is published. The wording under test is
-- the most confidential thing on the platform, and an administrator had no
-- reason to see any of it.
--
-- WHAT AN ADMINISTRATOR KEEPS. Their own studies, exactly as any owner has
-- them. Profiles, which is how accounts are managed and how the overview
-- below puts a name to an owner. The feedback list.
--
-- WHAT REPLACES THE ACCESS. admin_study_overview(), below: owner, type,
-- status, dates, a short reference and the participant counts. No title and
-- no slug. The slug matters as much as the title: it is the public link, so
-- an administrator holding it could read the whole test through the
-- participant page and this change would be theatre.

begin;

-- ---------------------------------------------------------------------
-- 1. Remove the administrator branch from every content policy.
-- ---------------------------------------------------------------------
do $rewrite$
declare
  p record;
  new_qual text;
  new_check text;
  statement text;
  changed integer := 0;
begin
  for p in
    select schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and tablename <> 'profiles'                       -- profiles is how accounts are managed
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%is_admin%'
    order by tablename, policyname
  loop
    -- The administrator branch is always an OR arm of the same shape. It is
    -- removed as a whole term rather than by rewriting the expression, so
    -- the owner and published branches are carried across untouched.
    new_qual  := replace(p.qual,       ' OR private.is_admin()', '');
    new_check := replace(p.with_check, ' OR private.is_admin()', '');

    if coalesce(new_qual, '') like '%is_admin%' or coalesce(new_check, '') like '%is_admin%' then
      raise exception
        'Policy % on % still mentions is_admin after the removal. Its expression is not the shape this migration expects. Aborting.',
        p.policyname, p.tablename;
    end if;

    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);

    statement := format('create policy %I on %I.%I as %s for %s to %s',
                        p.policyname, p.schemaname, p.tablename,
                        p.permissive, p.cmd, array_to_string(p.roles, ', '));
    if new_qual is not null then
      statement := statement || format(' using (%s)', new_qual);
    end if;
    if new_check is not null then
      statement := statement || format(' with check (%s)', new_check);
    end if;

    execute statement;
    changed := changed + 1;
  end loop;

  if changed <> 25 then
    raise exception 'Expected to rewrite 25 policies, rewrote %. Aborting.', changed;
  end if;

  raise notice 'Removed the administrator branch from % policies.', changed;
end
$rewrite$;

-- ---------------------------------------------------------------------
-- 2. What an administrator sees instead.
-- ---------------------------------------------------------------------
create or replace function public.admin_study_overview()
returns table (
  reference text,
  owner_name text,
  owner_email text,
  study_type text,
  status text,
  created_at timestamptz,
  published_at timestamptz,
  closed_at timestamptz,
  expires_at timestamptz,
  participants bigint,
  completed bigint
)
language sql
stable
security definer
set search_path = ''
as $fn$
  select
    -- Enough to talk about one test without naming it. An owner can match
    -- it to their own list; nobody else learns anything from it.
    upper(left(s.id::text, 6)) as reference,
    coalesce(p.display_name, '') as owner_name,
    coalesce(u.email::text, '') as owner_email,
    s.study_type,
    s.status,
    s.created_at,
    s.published_at,
    s.closed_at,
    s.expires_at,
    case s.study_type
      when 'tone_test' then (select count(*) from public.tone_sessions t where t.study_id = s.id)
      else (select count(*) from public.participant_sessions ps where ps.study_id = s.id)
    end as participants,
    case s.study_type
      when 'tone_test' then (select count(*) from public.tone_sessions t where t.study_id = s.id and t.completed_at is not null)
      else (select count(*) from public.participant_sessions ps where ps.study_id = s.id and ps.completed_at is not null)
    end as completed
  from public.studies s
  left join public.profiles p on p.id = s.owner_id
  left join auth.users u on u.id = s.owner_id
  where private.is_admin()
    and s.owner_id <> auth.uid()
  order by s.created_at desc;
$fn$;

comment on function public.admin_study_overview() is
  'Management data about other accountsّ studies, for an administrator. Owner, type, status, dates, a short reference and participant counts. Deliberately no title and no slug: the slug is the public link, and an administrator holding it could read the whole test through the participant page. Returns nothing to anyone who is not an administrator. See migration 022.';

revoke all on function public.admin_study_overview() from public;
grant execute on function public.admin_study_overview() to authenticated;

-- ---------------------------------------------------------------------
-- 3. Assertions.
-- ---------------------------------------------------------------------
do $checks$
declare
  remaining integer;
  on_profiles integer;
begin
  select count(*) into remaining
  from pg_policies
  where schemaname = 'public'
    and tablename <> 'profiles'
    and (coalesce(qual, '') || coalesce(with_check, '')) like '%is_admin%';

  if remaining <> 0 then
    raise exception '% content policy(ies) still grant an administrator access.', remaining;
  end if;

  select count(*) into on_profiles
  from pg_policies
  where schemaname = 'public'
    and tablename = 'profiles'
    and (coalesce(qual, '') || coalesce(with_check, '')) like '%is_admin%';

  if on_profiles <> 2 then
    raise exception 'Expected 2 administrator policies left on profiles, found %.', on_profiles;
  end if;

  raise notice 'Checks passed: no content policy grants an administrator access; profiles keeps its 2.';
end
$checks$;

commit;
