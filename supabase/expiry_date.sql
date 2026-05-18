alter table public.studies
add column if not exists expires_at timestamptz;

create index if not exists studies_expires_at_idx
on public.studies (expires_at);
