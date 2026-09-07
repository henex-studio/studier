-- 021. Take away the permission that allowed every published study to be
-- listed by anyone.
--
-- Covers Q-17, step two of two. Migration 020 added get_public_study and
-- must already be applied, and the client that calls it must already be
-- deployed. Applying this before that deployment takes every published
-- test link offline.
--
-- `studies anon published select` allowed an anonymous visitor to read any
-- row with status 'published'. Because a policy cannot see the query's
-- WHERE clause, that also allowed reading all of them in one request. The
-- participant pages no longer need it: they call get_public_study with the
-- link code they were given.
--
-- What is deliberately left alone: the three policies for `authenticated`.
-- The test collection lists an operator's own studies by reading this
-- table, and that is the correct way for it to work.
--
-- Verified afterwards from a browser with no session, against the deployed
-- site, not from SQL: listing the table returns 42501, looking a published
-- slug up returns the study without owner_id, looking up a draft returns
-- null, and both participant links still open and run.

drop policy if exists "studies anon published select" on public.studies;

revoke select on public.studies from anon;

do $checks$
declare
  n integer;
  probe jsonb;
begin
  select count(*) into n
  from pg_policies
  where schemaname = 'public' and tablename = 'studies' and 'anon' = any(roles);
  if n <> 0 then
    raise exception '% policy(ies) on studies still name anon.', n;
  end if;

  select count(*) into n
  from information_schema.column_privileges
  where table_schema = 'public' and table_name = 'studies'
    and grantee = 'anon' and privilege_type = 'SELECT';
  if n <> 0 then
    raise exception 'anon still holds select on % column(s) of studies.', n;
  end if;

  -- Removing an access rule is only half of it. If the replacement stops
  -- working the participant sees nothing, and this migration should fail
  -- rather than leave that state behind.
  select public.get_public_study('driver-licence-renewal-reminder-hsurx') into probe;
  if probe is null then
    raise exception 'The replacement lookup stopped returning a published study. Aborting.';
  end if;

  select count(*) into n
  from pg_policies
  where schemaname = 'public' and tablename = 'studies';
  if n <> 4 then
    raise exception 'Expected 4 policies left on studies, found %.', n;
  end if;

  raise notice 'anon can no longer read the studies table. get_public_study still resolves a published slug. 4 policies remain.';
end
$checks$;
