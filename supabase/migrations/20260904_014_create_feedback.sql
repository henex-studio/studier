-- Step 5b. A feedback channel. Structure copied from fevnote's feedback
-- table and admin read path (fevnote migration 0005_add_feedback.sql, 14
-- Aug 2026) rather than redesigned; see HANDOVER.md and DEV-PLAN.md Step
-- 5b for the reasoning. Two properties carried over deliberately:
--
--   * No update or delete policy. Feedback is write-once from the
--     sender's side. There is no "edit my feedback" and no "delete my
--     feedback" in the app, so what the operator reads is exactly what
--     was sent. Withdrawing feedback is a support request, not a button.
--
--   * No RLS policy grants read access to rows the sender does not own.
--     Admin access goes through admin_feedback_list() below, a security
--     definer function that checks is_admin() itself, matching how every
--     other admin read in this product works (see is_admin() and its
--     callers in schema.sql). This keeps every ordinary table policy
--     scoped strictly to owner_id = auth.uid(), with no per-table admin
--     exception anywhere.

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category text not null default 'other',
  message text not null,
  created_at timestamptz not null default now(),

  constraint feedback_category_allowed check (category in ('bug', 'idea', 'other')),
  constraint feedback_message_length check (length(trim(message)) between 1 and 2000)
);

create index feedback_owner on public.feedback (owner_id);
create index feedback_created on public.feedback (created_at desc);

alter table public.feedback enable row level security;

create policy feedback_insert_own on public.feedback
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy feedback_select_own on public.feedback
  for select to authenticated
  using (owner_id = (select auth.uid()));


-- admin_feedback_list ---------------------------------------------------
-- Every submission, newest first, joined with enough of the sender's
-- identity to make replying possible.

create or replace function public.admin_feedback_list()
returns table (
  id uuid,
  user_id uuid,
  email text,
  display_name text,
  category text,
  message text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Not authorised';
  end if;

  return query
  select
    f.id,
    f.owner_id,
    u.email::text,
    p.display_name,
    f.category,
    f.message,
    f.created_at
  from public.feedback f
  join auth.users u on u.id = f.owner_id
  left join public.profiles p on p.id = f.owner_id
  order by f.created_at desc;
end;
$$;

revoke execute on function public.admin_feedback_list() from public, anon;
grant execute on function public.admin_feedback_list() to authenticated;
