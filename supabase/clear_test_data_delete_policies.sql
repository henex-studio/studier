-- Allow study owners and admins to clear response data for their own studies.
-- Run this in Supabase SQL Editor before using Clear test data.

alter table public.task_responses enable row level security;
alter table public.final_responses enable row level security;
alter table public.participant_sessions enable row level security;

drop policy if exists "Owners and admins can delete task responses" on public.task_responses;
drop policy if exists "Owners and admins can delete final responses" on public.final_responses;
drop policy if exists "Owners and admins can delete participant sessions" on public.participant_sessions;

create policy "Owners and admins can delete task responses"
on public.task_responses
for delete
to authenticated
using (
  exists (
    select 1
    from public.studies
    join public.profiles on profiles.id = auth.uid()
    where studies.id = task_responses.study_id
      and (studies.owner_id = auth.uid() or profiles.role = 'admin')
  )
);

create policy "Owners and admins can delete final responses"
on public.final_responses
for delete
to authenticated
using (
  exists (
    select 1
    from public.studies
    join public.profiles on profiles.id = auth.uid()
    where studies.id = final_responses.study_id
      and (studies.owner_id = auth.uid() or profiles.role = 'admin')
  )
);

create policy "Owners and admins can delete participant sessions"
on public.participant_sessions
for delete
to authenticated
using (
  exists (
    select 1
    from public.studies
    join public.profiles on profiles.id = auth.uid()
    where studies.id = participant_sessions.study_id
      and (studies.owner_id = auth.uid() or profiles.role = 'admin')
  )
);
