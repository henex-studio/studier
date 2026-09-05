-- Self-service account deletion. PLAN-account-deletion.md Step 1.
--
-- Takes no parameters, deliberately. The caller is read from auth.uid() and
-- from nothing else, so a caller can only ever delete themselves. The last
-- SECURITY DEFINER function of this shape in this repository,
-- complete_invite_registration, took a user id as an ordinary parameter and
-- was exactly the hole closed in migration 005. This one cannot be pointed
-- at another account, because there is nowhere to point it.
--
-- Everything else is removed by cascades that already exist:
--   profiles.id       -> auth.users(id)  on delete cascade
--   studies.owner_id  -> auth.users(id)  on delete cascade
--   feedback.owner_id -> auth.users(id)  on delete cascade
-- and every remaining table cascades off studies(id), including the six
-- tone test tables added after schema.sql was written. Deleting one row
-- from auth.users therefore removes the profile, every study that account
-- owns, the trees, tasks and questions inside them, every participant
-- session, every task and final response, every tone variant, question,
-- response and gate judgement, and that account's feedback.
--
-- The last remaining administrator is refused, per operator decision D2 on
-- 5 September 2026. Nothing in the product can restore administrator access
-- once the only administrator is gone.
--
-- Participant responses are destroyed along with the account, per operator
-- decision D1 on the same date. That is the intended behaviour and the
-- interface is required to say so in plain words before it calls this.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  caller uuid := auth.uid();
  caller_role text;
  other_admins integer;
begin
  if caller is null then
    raise exception 'Not signed in.';
  end if;

  select role into caller_role from public.profiles where id = caller;

  if caller_role = 'admin' then
    select count(*) into other_admins
    from public.profiles
    where role = 'admin' and id <> caller;

    if other_admins = 0 then
      raise exception 'This is the only administrator account. Make another account an administrator before deleting this one.';
    end if;
  end if;

  delete from auth.users where id = caller;
end;
$$;

-- Signed-in callers only. An anonymous caller has no auth.uid() and would
-- fail the first check anyway, but the grant is narrowed rather than left
-- to that, on the reasoning in migration 006.
revoke all on function public.delete_my_account() from public;
revoke all on function public.delete_my_account() from anon;
grant execute on function public.delete_my_account() to authenticated;
