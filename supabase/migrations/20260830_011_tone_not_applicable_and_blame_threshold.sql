-- Milestone 4 Step 0.
--
-- Two schema changes, batched into one migration because both are small and
-- both are prerequisites for scoring.
--
-- 1. "Not applicable" on rating questions. HANDOVER.md section 2.5 settled
--    this when the scale was settled, but it was never built. Stored as an
--    explicit row rather than as no row, so that "this did not apply to me"
--    stays distinguishable from "never answered". Evidence Confidence counts
--    the second as missing evidence and must not count the first.
--
-- 2. The per-study blame flag threshold, settled by the operator on
--    30 August 2026. Default 3.5.

alter table public.tone_responses
  add column if not exists not_applicable boolean not null default false;

-- The old constraint required a rating or some text, which refuses a row
-- that is deliberately neither. Widened to accept a row explicitly marked
-- not applicable, while still refusing an empty row that claims to be a
-- real answer.
alter table public.tone_responses
  drop constraint if exists tone_responses_has_a_value;

alter table public.tone_responses
  add constraint tone_responses_has_a_value check (
    not_applicable
    or rating_value is not null
    or nullif(trim(both from coalesce(text_value, '')), '') is not null
  );

-- A row cannot be both not applicable and carry an answer.
alter table public.tone_responses
  add constraint tone_responses_na_is_empty check (
    not not_applicable
    or (rating_value is null and nullif(trim(both from coalesce(text_value, '')), '') is null)
  );

alter table public.tone_test_settings
  add column if not exists blame_flag_threshold numeric(3,2) not null default 3.5;

alter table public.tone_test_settings
  add constraint tone_test_settings_blame_threshold_range
    check (blame_flag_threshold >= 1 and blame_flag_threshold <= 5);
