-- Audit finding A1. is_admin, is_study_owner and is_study_published are all
-- SECURITY DEFINER and none of them fixed its search_path. Every row level
-- security policy in this database calls at least one of them, so they are
-- the three functions that decide who can read what. A SECURITY DEFINER
-- function with a mutable search_path is the standard Postgres privilege
-- escalation shape: an attacker able to create an object in a schema
-- searched earlier can shadow the table the function reads.
--
-- Exploitability here is low, because the authenticated role in Supabase
-- cannot create schemas or tables. The reason to fix it anyway is that
-- these three gate all access control, which makes them the wrong place to
-- leave a known weakness. delete_my_account and start_tone_session already
-- set it; this brings the older three up to the same standard.
--
-- search_path is set to the empty string rather than to public, matching
-- start_tone_session. Every reference inside all three bodies is already
-- schema qualified (public.profiles, public.studies, auth.uid()), so name
-- resolution cannot fall back to anything, and behaviour is unchanged.
--
-- Bodies below are byte for byte what was live before this migration, read
-- from pg_get_functiondef. Only the search_path line is new.
--
-- CREATE OR REPLACE keeps existing ownership and grants, which matters:
-- see the note on A2 at the bottom of this file.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$function$;

create or replace function public.is_study_owner(study_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1 from public.studies
    where id = study_uuid and owner_id = auth.uid()
  );
$function$;

create or replace function public.is_study_published(study_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select exists (
    select 1 from public.studies
    where id = study_uuid and status = 'published'
  );
$function$;

-- Audit finding A2 is deliberately NOT acted on here, and the audit's own
-- recommendation on it was wrong.
--
-- A2 proposed revoking execute from anon on these three functions, on the
-- grounds that participants never need them. Participants do need them.
-- Six policies are granted to {anon, authenticated} and call all three:
--
--   study_tasks            tasks owner admin or published select
--   study_trees            trees owner admin or published select
--   study_final_questions  final questions owner admin or published select
--   tone_questions         tone questions owner admin or published select
--   tone_variants          tone variants owner admin or published select
--   tone_test_settings     tone settings owner admin or published select
--
-- each with the condition
--   is_study_published(study_id) OR is_study_owner(study_id) OR is_admin()
--
-- A policy expression is evaluated with the privileges of the caller, so an
-- anonymous participant needs execute on all three to read the tasks, tree,
-- questions, wordings and settings of a published test. Revoking it would
-- have made every public test link fail with a permission error.
--
-- The real exposure A2 describes is that these functions are reachable as
-- REST endpoints under /rest/v1/rpc/, where is_study_published will confirm
-- whether a study id is published to anyone already holding that id. The
-- fix for that is to move the helpers into a schema PostgREST does not
-- expose and repoint every policy at them, which rewrites more than twenty
-- policies and is a decision for the operator, not a line in this file.
-- Recorded in AUDIT-2026-09-05.md under the corrected A2.
