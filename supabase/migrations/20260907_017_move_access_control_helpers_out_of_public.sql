-- 017. Move the three access control helpers out of the exposed API schema.
--
-- Covers audit finding A2 as corrected on 6 September 2026.
--
-- WHAT IS WRONG. is_admin(), is_study_owner(uuid) and is_study_published(uuid)
-- live in `public`, which PostgREST exposes, so all three are callable by an
-- anonymous visitor as /rest/v1/rpc/is_admin and so on. They are internal
-- judgements used by row level security, not part of the application's API.
--
-- WHAT WAS TRIED AND REJECTED. The original audit said to revoke execute from
-- `anon`. That is wrong and would have broken every public test link. A policy
-- expression is evaluated with the privileges of the caller, so an anonymous
-- participant genuinely needs execute on the functions their policy calls.
--
-- That was previously reasoned about rather than tested. It has now been
-- tested. On 7 September 2026 a throwaway schema was created with one table,
-- one security definer function, one policy for `anon` calling that function,
-- and execute revoked from public and anon. Reading the table as `anon`
-- failed with "permission denied for function helper". The schema was dropped
-- afterwards. Revoking execute is therefore not an option, and this migration
-- does not do it.
--
-- WHAT THIS DOES INSTEAD. Moves the three functions into a `private` schema.
-- PostgREST only introspects the schemas it is configured to expose, which
-- here are `public` and `graphql_public`, so a function in `private` has no
-- REST route. Execute stays granted, so policies keep working.
--
-- WHY THE POLICIES ARE NOT REWRITTEN. A policy stores the function it calls by
-- object identifier, not by name. ALTER FUNCTION ... SET SCHEMA keeps that
-- identifier, so all twenty-seven policies across fourteen tables follow the
-- functions automatically. Rewriting them by hand would be twenty-seven
-- chances to change an access rule by accident, for no gain.
--
-- WHY SEVEN OTHER FUNCTIONS ARE EDITED. Function bodies are text, resolved at
-- run time, and seven functions call these helpers by their fully qualified
-- name while running with an empty search path. They would fail at run time
-- with "function public.is_study_published(uuid) does not exist" the moment
-- the helpers moved. Five of the seven are on the participant path, including
-- starting a session and submitting an answer, so this is not a detail.
--
--   admin_feedback_list          public.is_admin()
--   get_tone_session             public.is_study_published(p_study_id)
--   start_tone_session           public.is_study_published(p_study_id)
--   submit_final_response        public.is_study_published(v_study_id)
--   submit_task_response         public.is_study_published(v_study_id)
--   tone_session_id_for_writing  public.is_study_published(p_study_id)
--   upsert_participant_session   public.is_study_published(p_study_id)
--
-- Those seven are repointed from their own stored definitions rather than
-- retyped here. Retyping seven function bodies to change one qualifier in each
-- is seven chances to introduce a typo into working participant code. The
-- rewrite below substitutes the schema qualifier and nothing else, and asserts
-- the count it changed, so a substitution that matched too much or too little
-- aborts the migration instead of shipping.

begin;

create schema if not exists private;

comment on schema private is
  'Internal database helpers that must not be reachable over the REST API. '
  'Nothing here is part of the application interface. Row level security '
  'policies call these functions, so anon and authenticated need usage on '
  'this schema and execute on its functions. See migration 017.';

-- Usage, not create. anon and authenticated must be able to call what is in
-- here because their policies do, but they have no business adding to it.
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

alter function public.is_admin() set schema private;
alter function public.is_study_owner(uuid) set schema private;
alter function public.is_study_published(uuid) set schema private;

-- Grants travel with the function, so these are belt and braces. They are
-- stated because the failure they prevent, an anonymous participant unable to
-- open a published test, is silent from the operator's side.
grant execute on function private.is_admin() to anon, authenticated, service_role;
grant execute on function private.is_study_owner(uuid) to anon, authenticated, service_role;
grant execute on function private.is_study_published(uuid) to anon, authenticated, service_role;

do $migration$
declare
  target record;
  new_definition text;
  hits integer;
  total integer := 0;
  functions_changed integer := 0;
begin
  for target in
    select p.oid, p.proname, pg_get_functiondef(p.oid) as definition
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and p.prosrc ~ 'public\.(is_admin|is_study_owner|is_study_published)\s*\('
    order by p.proname
  loop
    select count(*) into hits
    from regexp_matches(
      target.definition,
      'public\.(is_admin|is_study_owner|is_study_published)\s*\(',
      'g'
    );

    if hits <> 1 then
      raise exception
        'Expected exactly one helper call in %, found %. Aborting rather than guessing.',
        target.proname, hits;
    end if;

    new_definition := regexp_replace(
      target.definition,
      'public\.(is_admin|is_study_owner|is_study_published)\s*\(',
      'private.\1(',
      'g'
    );

    if new_definition = target.definition then
      raise exception 'Substitution changed nothing in %. Aborting.', target.proname;
    end if;

    execute new_definition;

    total := total + hits;
    functions_changed := functions_changed + 1;
  end loop;

  if functions_changed <> 7 then
    raise exception
      'Expected to repoint 7 functions, repointed %. The set of callers has changed since this migration was written. Aborting.',
      functions_changed;
  end if;

  raise notice 'Repointed % calls across % functions.', total, functions_changed;
end
$migration$;

-- Assertions. A migration that touches access control states what it expects
-- to be true afterwards and fails if it is not, rather than leaving the
-- checking to whoever notices something broken later.
do $checks$
declare
  leftover integer;
  moved integer;
  policies integer;
begin
  select count(*) into leftover
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.prokind = 'f'
    and p.prosrc ~ 'public\.(is_admin|is_study_owner|is_study_published)\s*\(';

  if leftover <> 0 then
    raise exception '% function(s) in public still call the helpers by their old name.', leftover;
  end if;

  select count(*) into moved
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private'
    and p.proname in ('is_admin', 'is_study_owner', 'is_study_published');

  if moved <> 3 then
    raise exception 'Expected 3 helpers in private, found %.', moved;
  end if;

  select count(*) into leftover
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('is_admin', 'is_study_owner', 'is_study_published');

  if leftover <> 0 then
    raise exception '% helper(s) are still in public.', leftover;
  end if;

  -- The policies should have followed the functions without being touched.
  select count(*) into policies
  from pg_policies
  where schemaname = 'public'
    and (coalesce(qual, '') || coalesce(with_check, '')) ~ 'is_admin|is_study_owner|is_study_published';

  if policies <> 27 then
    raise exception
      'Expected 27 policies still calling the helpers, found %. The policies did not follow the move as intended.',
      policies;
  end if;

  raise notice 'Checks passed: 3 helpers in private, 0 left in public, 27 policies intact.';
end
$checks$;

commit;
