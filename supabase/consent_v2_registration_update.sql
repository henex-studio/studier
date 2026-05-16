alter table public.profiles
add column if not exists display_name text,
add column if not exists consent_accepted_at timestamptz,
add column if not exists consent_version text;

create table if not exists public.invite_codes (
  code text primary key,
  role text not null default 'user' check (role in ('user', 'admin')),
  is_active boolean not null default true,
  max_uses integer not null default 10 check (max_uses > 0),
  used_count integer not null default 0 check (used_count >= 0),
  created_at timestamptz not null default now(),
  expires_at timestamptz null
);

alter table public.invite_codes enable row level security;

create or replace function public.validate_invite_code(p_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(trim(coalesce(p_code, '')));
  v_invite public.invite_codes%rowtype;
begin
  if v_code = '' then
    return false;
  end if;

  select * into v_invite
  from public.invite_codes
  where code = v_code;

  if not found then
    return false;
  end if;

  if v_invite.is_active is not true then
    return false;
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at < now() then
    return false;
  end if;

  if v_invite.used_count >= v_invite.max_uses then
    return false;
  end if;

  return true;
end;
$$;

create or replace function public.complete_invite_registration(
  p_user_id uuid,
  p_email text,
  p_display_name text,
  p_code text,
  p_consent_version text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(trim(coalesce(p_code, '')));
  v_display_name text := nullif(trim(coalesce(p_display_name, '')), '');
  v_email text := lower(trim(coalesce(p_email, '')));
  v_consent_version text := nullif(trim(coalesce(p_consent_version, '')), '');
  v_invite public.invite_codes%rowtype;
begin
  if p_user_id is null then
    raise exception 'Missing user id.';
  end if;

  if v_email = '' then
    raise exception 'Missing email.';
  end if;

  if v_display_name is null then
    raise exception 'Display name is required.';
  end if;

  if v_code = '' then
    raise exception 'Invite code is required.';
  end if;

  if v_consent_version is null then
    raise exception 'Consent is required.';
  end if;

  select * into v_invite
  from public.invite_codes
  where code = v_code
  for update;

  if not found then
    raise exception 'Invite code is not valid.';
  end if;

  if v_invite.is_active is not true then
    raise exception 'Invite code is not active.';
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at < now() then
    raise exception 'Invite code has expired.';
  end if;

  if v_invite.used_count >= v_invite.max_uses then
    raise exception 'Invite code has reached its use limit.';
  end if;

  update public.invite_codes
  set used_count = used_count + 1
  where code = v_code;

  insert into public.profiles (id, email, role, display_name, consent_accepted_at, consent_version)
  values (p_user_id, v_email, v_invite.role, v_display_name, now(), v_consent_version)
  on conflict (id)
  do update set
    email = excluded.email,
    role = excluded.role,
    display_name = excluded.display_name,
    consent_accepted_at = excluded.consent_accepted_at,
    consent_version = excluded.consent_version;

  return true;
end;
$$;

create or replace function public.accept_platform_consent(p_consent_version text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_consent_version text := nullif(trim(coalesce(p_consent_version, '')), '');
begin
  if auth.uid() is null then
    raise exception 'Not signed in.';
  end if;

  if v_consent_version is null then
    raise exception 'Consent version is required.';
  end if;

  update public.profiles
  set
    consent_accepted_at = now(),
    consent_version = v_consent_version
  where id = auth.uid();

  return true;
end;
$$;

grant execute on function public.validate_invite_code(text) to anon, authenticated;
grant execute on function public.complete_invite_registration(uuid, text, text, text, text) to anon, authenticated;
grant execute on function public.accept_platform_consent(text) to authenticated;

insert into public.invite_codes (code, role, is_active, max_uses, used_count)
values ('STUDIER-PILOT-2026', 'user', true, 10, 0)
on conflict (code)
do update set
  role = excluded.role,
  is_active = excluded.is_active,
  max_uses = excluded.max_uses;
