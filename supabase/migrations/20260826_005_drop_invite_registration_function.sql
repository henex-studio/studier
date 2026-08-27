-- Registration plan Step 7a. Applied 26 August 2026, after the operator
-- verified the full rewritten registration, confirmation, and password
-- reset flow on the deployed preview with no issues.
--
-- complete_invite_registration ran with owner privileges and was callable
-- by anyone signed out, taking the user id as a plain parameter rather
-- than reading it from the caller's session, and writing to profiles with
-- on conflict do update. A caller holding a valid invite code and a known
-- user id could have overwritten that user's profile row, including the
-- role field. No page has called this function since Registration Step 5
-- moved profile creation into the public.handle_new_user trigger.
--
-- Not reversible by re-running this file. If this function is ever
-- needed again, restore it from supabase/invite_registration.sql or
-- supabase/consent_v2_registration_update.sql, both kept as historical
-- record and protected from editing.
drop function if exists public.complete_invite_registration(uuid, text, text, text);
drop function if exists public.complete_invite_registration(uuid, text, text, text, text);

-- accept_platform_consent only ever needs to run for someone already
-- signed in, since it updates auth.uid()'s own row. It was reachable by
-- anon for no reason tied to actual use.
revoke execute on function public.accept_platform_consent(text) from anon;
