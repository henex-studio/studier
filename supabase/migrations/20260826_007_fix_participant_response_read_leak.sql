-- Closes a data exposure found on 26 August 2026 while gathering facts
-- for the privacy policy, and confirmed by querying the live database as
-- the anon role rather than by reading policy text.
--
-- Anyone, without an account, could read every response to any published
-- study: 256 task responses, 29 final responses and 29 participant
-- sessions were readable in the test. Overwriting another participant's
-- answers was also possible, and was demonstrated in a transaction that
-- was then rolled back.
--
-- Cause. Two generations of policies sat on these three tables. The newer
-- ones ("... owner admin select") are correct and restrict reads to the
-- study owner and administrators. The older ones ("Public participants
-- can select ...") allowed any anonymous caller to read every row
-- belonging to a published study. Row level security policies combine
-- with OR, so the permissive older policy overrode the stricter newer one
-- completely.
--
-- The older INSERT and UPDATE policies are dropped at the same time. They
-- duplicated the newer ones exactly, differing only in spelling the
-- published check inline rather than calling is_study_published, and two
-- generations of policy on one table is how this was missed.
--
-- This migration alone leaves submission broken. See 008, which finishes
-- the job. The two were applied minutes apart and belong together.

drop policy if exists "Public participants can select task responses" on public.task_responses;
drop policy if exists "Public participants can insert task responses" on public.task_responses;
drop policy if exists "Public participants can update task responses" on public.task_responses;

drop policy if exists "Public participants can select final responses" on public.final_responses;
drop policy if exists "Public participants can insert final responses" on public.final_responses;
drop policy if exists "Public participants can update final responses" on public.final_responses;

drop policy if exists "Public participants can select participant sessions" on public.participant_sessions;
drop policy if exists "Public participants can insert participant sessions" on public.participant_sessions;
drop policy if exists "Public participants can update participant sessions" on public.participant_sessions;
