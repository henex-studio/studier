create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz default now()
);

create table if not exists public.studies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  welcome_text jsonb not null default '[]'::jsonb,
  welcome_bullets jsonb not null default '[]'::jsonb,
  privacy_text jsonb not null default '[]'::jsonb,
  end_text jsonb not null default '[]'::jsonb,
  data_collection_settings jsonb not null default '{"record_first_click":true,"record_click_history":true,"record_click_count":true,"record_backtrack_count":true,"record_time_seconds":true,"record_depth":true,"record_match_type":true,"record_hesitation_flag":true}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  published_at timestamptz,
  closed_at timestamptz
);

create table if not exists public.study_trees (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies(id) on delete cascade,
  csv_text text not null default '',
  tree_json jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.study_tasks (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies(id) on delete cascade,
  task_order int not null,
  task_text text not null,
  target_paths jsonb not null default '[]'::jsonb,
  acceptable_paths jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.study_final_questions (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies(id) on delete cascade,
  question_order int not null,
  question_key text not null,
  question_type text not null check (question_type in ('choice', 'text')),
  question_text text not null,
  options jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.participant_sessions (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies(id) on delete cascade,
  participant_id text not null,
  started_at timestamptz default now(),
  completed_at timestamptz,
  unique(study_id, participant_id)
);

create table if not exists public.task_responses (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies(id) on delete cascade,
  participant_id text not null,
  task_id uuid not null references public.study_tasks(id) on delete cascade,
  task_order int not null,
  task_text text not null,
  selected_path text,
  skipped boolean default false,
  target_path text,
  target_paths jsonb,
  acceptable_paths jsonb,
  match_type text,
  is_correct boolean,
  first_click_path text,
  click_history jsonb,
  depth int,
  click_count int,
  backtrack_count int,
  hesitation_flag boolean,
  time_seconds int,
  submitted_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(study_id, participant_id, task_id)
);

create table if not exists public.final_responses (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies(id) on delete cascade,
  participant_id text not null,
  final_answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(study_id, participant_id)
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_study_owner(study_uuid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.studies
    where id = study_uuid and owner_id = auth.uid()
  );
$$;

create or replace function public.is_study_published(study_uuid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.studies
    where id = study_uuid and status = 'published'
  );
$$;

alter table public.profiles enable row level security;
alter table public.studies enable row level security;
alter table public.study_trees enable row level security;
alter table public.study_tasks enable row level security;
alter table public.study_final_questions enable row level security;
alter table public.participant_sessions enable row level security;
alter table public.task_responses enable row level security;
alter table public.final_responses enable row level security;

drop policy if exists "profiles own or admin select" on public.profiles;
create policy "profiles own or admin select" on public.profiles
for select to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update" on public.profiles
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "studies owner or admin select" on public.studies;
create policy "studies owner or admin select" on public.studies
for select to authenticated
using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "studies anon published select" on public.studies;
create policy "studies anon published select" on public.studies
for select to anon
using (status = 'published');

drop policy if exists "studies owner insert" on public.studies;
create policy "studies owner insert" on public.studies
for insert to authenticated
with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists "studies owner or admin update" on public.studies;
create policy "studies owner or admin update" on public.studies
for update to authenticated
using (owner_id = auth.uid() or public.is_admin())
with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists "studies owner or admin delete" on public.studies;
create policy "studies owner or admin delete" on public.studies
for delete to authenticated
using (owner_id = auth.uid() or public.is_admin());

drop policy if exists "trees owner admin or published select" on public.study_trees;
create policy "trees owner admin or published select" on public.study_trees
for select to authenticated, anon
using (public.is_study_published(study_id) or public.is_study_owner(study_id) or public.is_admin());

drop policy if exists "trees owner admin all" on public.study_trees;
create policy "trees owner admin all" on public.study_trees
for all to authenticated
using (public.is_study_owner(study_id) or public.is_admin())
with check (public.is_study_owner(study_id) or public.is_admin());

drop policy if exists "tasks owner admin or published select" on public.study_tasks;
create policy "tasks owner admin or published select" on public.study_tasks
for select to authenticated, anon
using (public.is_study_published(study_id) or public.is_study_owner(study_id) or public.is_admin());

drop policy if exists "tasks owner admin all" on public.study_tasks;
create policy "tasks owner admin all" on public.study_tasks
for all to authenticated
using (public.is_study_owner(study_id) or public.is_admin())
with check (public.is_study_owner(study_id) or public.is_admin());

drop policy if exists "final questions owner admin or published select" on public.study_final_questions;
create policy "final questions owner admin or published select" on public.study_final_questions
for select to authenticated, anon
using (public.is_study_published(study_id) or public.is_study_owner(study_id) or public.is_admin());

drop policy if exists "final questions owner admin all" on public.study_final_questions;
create policy "final questions owner admin all" on public.study_final_questions
for all to authenticated
using (public.is_study_owner(study_id) or public.is_admin())
with check (public.is_study_owner(study_id) or public.is_admin());

drop policy if exists "sessions anon insert update published" on public.participant_sessions;
create policy "sessions anon insert update published" on public.participant_sessions
for all to anon
using (public.is_study_published(study_id))
with check (public.is_study_published(study_id));

drop policy if exists "sessions owner admin select" on public.participant_sessions;
create policy "sessions owner admin select" on public.participant_sessions
for select to authenticated
using (public.is_study_owner(study_id) or public.is_admin());

drop policy if exists "task responses anon upsert published" on public.task_responses;
create policy "task responses anon upsert published" on public.task_responses
for all to anon
using (public.is_study_published(study_id))
with check (public.is_study_published(study_id));

drop policy if exists "task responses owner admin select" on public.task_responses;
create policy "task responses owner admin select" on public.task_responses
for select to authenticated
using (public.is_study_owner(study_id) or public.is_admin());

drop policy if exists "final responses anon upsert published" on public.final_responses;
create policy "final responses anon upsert published" on public.final_responses
for all to anon
using (public.is_study_published(study_id))
with check (public.is_study_published(study_id));

drop policy if exists "final responses owner admin select" on public.final_responses;
create policy "final responses owner admin select" on public.final_responses
for select to authenticated
using (public.is_study_owner(study_id) or public.is_admin());
