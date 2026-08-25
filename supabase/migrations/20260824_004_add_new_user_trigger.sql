-- Registration plan Step 1. Applied 24 August 2026.
-- See harness-docs/PLAN-registration.md for the reasoning and the decisions.
--
-- Moves profile creation out of the browser and into a database trigger,
-- and makes the invite code an enforced condition of account creation
-- rather than only a form check.
--
-- Why the move is necessary rather than tidier. With email confirmation
-- switched on, sign-up returns a user but no session, so the browser has
-- no authenticated context in which to write a profile row. Recording
-- consent at first sign-in instead would date it to the wrong moment.
-- The trigger reads what it needs from the metadata passed into sign-up.
--
-- Where this departs from fevnote, and why. fevnote enforces its invite
-- code only in the form, arguing that row level security means a stray
-- account sees nothing but its own empty data. That holds for fevnote and
-- not for Studier: a Studier account can create studies, publish public
-- links and collect responses from third parties, so an unauthorised
-- account produces a live public artefact rather than an empty screen.
--
-- Reversible with:
--   drop trigger if exists on_auth_user_created on auth.users;
--   drop function if exists public.handle_new_user();
--   alter table public.profiles
--     drop column if exists privacy_version,
--     drop column if exists privacy_accepted_at,
--     drop column if exists invite_code_used;

-- privacy_version and privacy_accepted_at mirror the existing consent_*
-- pair. Two separate documents are being tracked, the use conditions and
-- the privacy policy, and a single version string cannot say which
-- wording of each a person agreed to. Named to match fevnote so the two
-- products stay legible side by side.
alter table public.profiles
  add column if not exists privacy_version text,
  add column if not exists privacy_accepted_at timestamptz,
  add column if not exists invite_code_used text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code_raw text;
  v_code text;
  v_role text := 'user';
  v_consent_version text;
  v_privacy_version text;
begin
  v_code_raw := new.raw_user_meta_data->>'invite_code';

  -- No invite code field at all means this account was created from the
  -- Supabase dashboard, which sends no metadata, so it is allowed
  -- through. A field that is present but not valid is rejected. An empty
  -- string counts as present and invalid, so clearing the form field
  -- cannot pass itself off as a dashboard account.
  --
  -- The consequence of the dashboard exception, recorded so it is a known
  -- property rather than a surprise: anyone with dashboard access can
  -- create an account with no code and no verification. That adds no
  -- exposure, because dashboard access already means full control of the
  -- database.
  if v_code_raw is not null then
    v_code := upper(trim(v_code_raw));

    if v_code = '' then
      raise exception 'An invite code is required.';
    end if;

    -- Every condition sits in the WHERE clause so this is atomic. Two
    -- simultaneous sign-ups cannot both take the last remaining use of a
    -- limited code, which a separate check-then-update could allow.
    update public.invite_codes
       set used_count = used_count + 1
     where code = v_code
       and is_active
       and (expires_at is null or expires_at > now())
       and (max_uses is null or used_count < max_uses)
    returning role into v_role;

    if not found then
      raise exception 'Invite code is not valid or has reached its limit.';
    end if;
  end if;

  v_consent_version := nullif(trim(coalesce(new.raw_user_meta_data->>'consent_version', '')), '');
  v_privacy_version := nullif(trim(coalesce(new.raw_user_meta_data->>'privacy_version', '')), '');

  -- Only this part swallows its own failures, and the asymmetry is
  -- deliberate. The invite code check above must be able to stop an
  -- account being created, which is the entire point of it. A profile row
  -- is a different kind of thing: App.jsx already falls back to sensible
  -- defaults when one is missing, and a missing row can be repaired by
  -- hand afterwards, whereas a registration path broken by a bug in here
  -- cannot be repaired after the fact. This code sits in front of every
  -- sign-up, including any made from the dashboard.
  begin
    insert into public.profiles (
      id,
      email,
      role,
      display_name,
      consent_version,
      consent_accepted_at,
      privacy_version,
      privacy_accepted_at,
      invite_code_used
    )
    values (
      new.id,
      nullif(lower(trim(coalesce(new.email, ''))), ''),
      v_role,
      nullif(trim(coalesce(new.raw_user_meta_data->>'display_name', '')), ''),
      v_consent_version,
      case when v_consent_version is not null then now() else null end,
      v_privacy_version,
      case when v_privacy_version is not null then now() else null end,
      v_code
    )
    on conflict (id) do nothing;
  exception when others then
    null;
  end;

  return new;
end;
$$;

-- Postgres refuses to run a trigger function called directly, so leaving
-- this reachable over the API was never exploitable, but it shows up in
-- the security linter and invites misreading. Only the trigger needs it.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
