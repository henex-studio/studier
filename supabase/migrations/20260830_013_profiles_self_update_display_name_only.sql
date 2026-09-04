-- Milestone 6 Step 5. Lets an account change its own display name.
--
-- Two things had to be true and neither was:
--
-- 1. The only UPDATE policy on profiles was is_admin(), so a normal user
--    could not change their own row at all. An account page written
--    without this would have saved nothing and said nothing.
--
-- 2. Both anon and authenticated held UPDATE on every column of profiles,
--    including role. Adding a self-update policy on top of that would have
--    let any signed-in user make themselves an admin. That was harmless
--    only because no policy allowed self-update in the first place.
--
-- So the policy is added and the grants are narrowed in the same migration.
-- Neither change is safe without the other.
--
-- accept_platform_consent and handle_new_user both write to profiles and
-- both are SECURITY DEFINER, so they run as the function owner and are
-- unaffected by the column grants below. Checked before revoking, not
-- assumed. No client code updates profiles directly; App.jsx and
-- StudyListPage.jsx only read.

revoke update on public.profiles from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;

create policy "profiles own display name update"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
