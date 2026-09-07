-- 020. A lookup that answers one link code at a time.
--
-- Covers Q-17, step one of two.
--
-- THE PROBLEM. `studies anon published select` allows an anonymous visitor
-- to read any row with status 'published'. A policy cannot see the query's
-- WHERE clause, so "you may read published studies" also means "you may
-- read all of them at once". Confirmed on 7 September 2026 by a browser
-- with no session, loading the deployed site, taking the public key out of
-- the site's own JavaScript, and calling the REST API: HTTP 200, three
-- rows, titles and link codes included. Not a misconfiguration of the key,
-- which ships in the page by design. The access rule is simply wider than
-- intended.
--
-- Why that matters here more than it would elsewhere: Tone Test exists to
-- check sensitive wording before it is published. The existence, title and
-- link of an unreleased notice being public is a different claim from the
-- one the guide already makes, that a test link is not secret.
--
-- THE FIX. This function takes a link code and returns at most one study.
-- Visibility is unchanged, matching the union of the two select policies:
-- published, or owned by the caller, or the caller is an admin. What
-- changes is that a caller must name the study they want. It also returns
-- only the columns the participant pages read, so owner_id, created_at,
-- updated_at and published_at stop travelling to the browser.
--
-- TWO MIGRATIONS, NOT ONE. This one only adds the function, which breaks
-- nothing and changes nothing. Migration 021 removes the anon policy and
-- grant, and must not be applied until the client that calls this function
-- is deployed. Applying both at once would take every published test link
-- offline for the length of a deployment.
--
-- HOW THIS IS VERIFIED. The checks below run with no signed-in user, so
-- they exercise the anonymous branch and only that. The owner and admin
-- branches cannot be reached from a migration, and the first draft of this
-- file asserted that a draft would be visible and aborted the whole
-- migration. That was the assertion being wrong, not the function. Those
-- branches are checked from a signed-in session instead.

create or replace function public.get_public_study(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $fn$
  select to_jsonb(s)
  from (
    select id, slug, title, status, study_type,
           welcome_text, welcome_bullets, privacy_text, end_text,
           data_collection_settings, expires_at, closed_at
    from public.studies
    where slug = p_slug
      and (
        status = 'published'
        or owner_id = auth.uid()
        or private.is_admin()
      )
  ) s;
$fn$;

comment on function public.get_public_study(text) is
  'Looks up one study by its link code. Returns null when the slug does not match or the caller may not see it. Visibility matches the studies select policies: published, or owned by the caller, or caller is admin. It exists so a participant page can find its study without anon holding select on the whole table, which allowed anyone to list every published study. See migration 020 and Q-17.';

grant execute on function public.get_public_study(text) to anon, authenticated, service_role;

do $checks$
declare
  published_hit jsonb;
  missing_hit jsonb;
  closed_or_draft jsonb;
begin
  select public.get_public_study('driver-licence-renewal-reminder-hsurx') into published_hit;
  if published_hit is null then
    raise exception 'A published study was not returned by its slug.';
  end if;

  if published_hit ? 'owner_id' then
    raise exception 'Returned owner_id, which a participant has no need for.';
  end if;

  if not (published_hit ? 'welcome_text' and published_hit ? 'study_type' and published_hit ? 'expires_at') then
    raise exception 'A column the participant pages read is missing from the result.';
  end if;

  select public.get_public_study('victim-hub-6gp9m') into closed_or_draft;
  if closed_or_draft is not null then
    raise exception 'A draft was returned to a caller with no session. It should not have been.';
  end if;

  select public.get_public_study('no-such-slug-at-all') into missing_hit;
  if missing_hit is not null then
    raise exception 'An unknown slug returned something.';
  end if;

  raise notice 'Checks passed for the anonymous branch. Owner and admin branches are verified from a signed-in session, not here.';
end
$checks$;
