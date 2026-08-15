-- Step 1 of Tone Test development. Applied 15 August 2026.
-- Adds a study type to the studies table so the platform can hold more than one kind of study.
-- Every existing study becomes a tree test.
-- Reversible with: alter table public.studies drop column study_type;

alter table public.studies
  add column if not exists study_type text not null default 'tree_test';

alter table public.studies
  drop constraint if exists studies_study_type_check;

alter table public.studies
  add constraint studies_study_type_check
  check (study_type in ('tree_test', 'tone_test'));

create index if not exists studies_study_type_idx on public.studies (study_type);
