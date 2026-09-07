import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { getParticipantId } from "../../lib/participantId";
import { ROLE_KEYS, ROLE_LABELS, ROLE_DESCRIPTIONS } from "../../lib/tonetest/defaultQuestions";
import PreviewBanner from "../../components/PreviewBanner";
import DoneCard from "../../components/DoneCard";

function isPastExpiry(value) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() <= Date.now();
}

// The order questions are shown in: ratings, then gates, then open text.
// Matches the order the builder's QuestionTemplateEditor already uses.
const QUESTION_TYPE_ORDER = ["rating", "gate", "open"];

const GATE_STATUS_OPTIONS = [
  { value: "pass", label: "Pass" },
  { value: "concern", label: "Concern" },
  { value: "fail", label: "Fail" }
];

// Everything a participant can do here reaches the database only through
// the entry points built in Milestone 3 Step 1 (get_tone_session,
// start_tone_session, and, from Step 4 on, the read-only tone_questions
// and tone_variants tables, whose select policies already allow anyone to
// read a published study's content). This page never writes tone_sessions,
// tone_responses or tone_gate_responses directly.
// Two callers. A participant reaches this by link code, and that is the
// only mode that writes anything. An operator reaches it from the Preview
// button with `preview` set and a study id instead of a slug, walks the
// same screens in the same order, and nothing is recorded.
//
// One component rather than a second page, decided by the operator on
// 7 September 2026 after the tree test's two copies drifted apart that
// morning. The rule for anything added here: if a branch on `preview`
// changes what a participant sees, it is wrong. Preview may only skip
// writing and add the banner.
export default function ToneTestRunnerPage({ slug, studyId, preview = false }) {
  const [loading, setLoading] = useState(true);
  const [study, setStudy] = useState(null);
  const [settings, setSettings] = useState(null);
  const [session, setSession] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState("");

  const [variants, setVariants] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [contentLoading, setContentLoading] = useState(false);

  // Ratings and gate answers are keyed by question, then by variant id,
  // because in compare-all mode a rating or a gate judgement is inherently
  // about one specific piece of wording. Open answers are keyed by
  // question only. The specification does not settle whether an open
  // question should be asked once or once per variant; asked once was
  // chosen here, since re-typing the same reflection three times is poor
  // participant experience and the questions read as reflective rather
  // than wording-specific ("What words felt unclear?" rather than
  // "Rate this wording"). Recorded as a design decision in DEV-LOG.md.
  const [ratingAnswers, setRatingAnswers] = useState({});
  const [gateAnswers, setGateAnswers] = useState({});
  const [openAnswers, setOpenAnswers] = useState({});
  const [preferredVariantId, setPreferredVariantId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [finished, setFinished] = useState(false);
  const [autoStarting, setAutoStarting] = useState(false);
  const [wordingExpanded, setWordingExpanded] = useState(false);
  const [activeWordingIndex, setActiveWordingIndex] = useState(0);
  const [questionsError, setQuestionsError] = useState("");

  const participantId = study ? getParticipantId(study.id) : "";

  // A link generated for one role carries ?role=<key> so the person it was
  // sent to lands straight on their own questions, with no "choose your
  // role" screen to get wrong. The bare link (no parameter, or an
  // unrecognised one) keeps the original self-select screen as a fallback,
  // so an existing link never breaks. See harness-docs/decision-log.md,
  // the role-links decision recorded 5 September 2026.
  const roleFromLink = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("role");
    return ROLE_KEYS.includes(value) ? value : null;
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      // One slug at a time, through get_public_study, instead of reading
      // the studies table. See Q-17 and migration 020: the permission that
      // let this page find its study also let anyone list every published
      // test. The function returns null rather than an error when the slug
      // is unknown or not visible to this caller, so both cases are
      // handled together below.
      // A preview is opened by id from the test collection, by someone who
      // is signed in and owns the test. A participant arrives with a link
      // code and no session. The rest of this function is the same for
      // both.
      const { data: studyData, error: studyError } = preview
        ? await supabase.from("studies").select("*").eq("id", studyId).single()
        : await supabase.rpc("get_public_study", { p_slug: slug });

      if (!active) return;

      if (studyError || !studyData) {
        setMessage(preview ? "Preview is not available." : "This test link is not available.");
        setLoading(false);
        return;
      }

      setStudy(studyData);

      // A preview exists so a draft can be checked before it goes out, so
      // it does not require the test to be published. A participant link
      // still does.
      if (!preview && studyData.status !== "published") {
        setLoading(false);
        return;
      }

      const { data: settingsData, error: settingsError } = await supabase
        .from("tone_test_settings")
        // Named columns, not *. A participant is anonymous, and anon is
        // granted select on this table one column at a time, deliberately
        // withholding content_score_weights_json,
        // evidence_confidence_settings_json and blame_flag_threshold, which
        // are the operator's scoring configuration and none of a
        // participant's business. Asking for * asks for those too, so the
        // whole request was refused with "permission denied for table
        // tone_test_settings" and the page fell back to defaults. See the
        // note on the tone_variants query below.
        .select("id, study_id, scenario, content_goal, sensitivity_level, variant_mode, active_roles_json")
        .eq("study_id", studyData.id)
        .maybeSingle();

      if (!active) return;
      setSettings(settingsData);

      const { data: variantRows, error: variantsError } = await supabase
        .from("tone_variants")
        // Named columns for the same reason, and this one was the visible
        // failure. anon may read every column here except internal_note,
        // the operator's private note about a wording. Asking for * asked
        // for internal_note as well, so PostgREST refused the whole request
        // with 42501 and the runner received no variants at all. A
        // participant therefore saw "No wording is available for this test
        // yet." above a full list of questions about wording they could not
        // read. Live since the feature shipped.
        //
        // It stayed hidden because it only happens when signed out. An
        // operator opening their own link, and the smoke test, both run as
        // authenticated, which holds table-level select and sees
        // everything. This is precisely the case CLAUDE.md section 5 warns
        // about: a session that carries authentication masks the fault.
        // Found 7 September 2026 by requesting the page's own query as an
        // anonymous visitor.
        .select("id, study_id, label, variant_text, display_order")
        .eq("study_id", studyData.id)
        .order("display_order");

      if (!active) return;
      setVariants(variantRows || []);

      // Say what actually went wrong. Both reads above previously took the
      // data and dropped the error, so a refused request looked exactly
      // like a test nobody had finished writing: "No wording is available
      // for this test yet." That sentence was on screen for weeks while
      // the real answer was "permission denied for table tone_variants".
      // A participant cannot act on either message, but the operator can
      // act on the second one and cannot act on the first.
      if (settingsError || variantsError) {
        setMessage((settingsError || variantsError).message);
      }

      // A preview never touches tone_sessions, in either direction. It does
      // not look for a session and it does not create one, so previewing a
      // live test cannot disturb a real participant's answers and cannot
      // add a session to the operator's own counts.
      if (preview) {
        setLoading(false);
        return;
      }

      // Reopening the link on the same browser returns to whatever session
      // already exists, using the participant identifier the existing
      // browser-side code already generates and stores, rather than
      // starting a second one.
      const pid = getParticipantId(studyData.id);
      const { data: sessionData, error: sessionError } = await supabase.rpc("get_tone_session", {
        p_study_id: studyData.id,
        p_participant_id: pid
      });

      if (!active) return;

      // A failure here previously read as "you have not started yet", which
      // is indistinguishable from a returning participant losing their
      // answers.
      if (sessionError) setMessage(sessionError.message);

      if (sessionData) {
        setSession(sessionData);
        setSelectedRole(sessionData.selected_role);
        setPreferredVariantId(sessionData.preferred_variant_id || null);
        // A session that already finished shows the end message again,
        // never a blank form or a second chance to answer. No need to load
        // questions for a screen that will not show them.
        if (sessionData.completed_at) {
          setFinished(true);
        } else {
          await loadQuestionsForRole(studyData.id, sessionData.selected_role);
        }
      }

      setLoading(false);
    }

    load();
    return () => { active = false; };
  }, [slug]);

  // Once the study, settings and any existing session have loaded, a
  // role-carrying link starts the session itself, with no click needed.
  // Guarded so it only ever runs once, and only when there is genuinely no
  // session yet: a returning participant's existing session always wins,
  // even if the link they used names a different role than the one they
  // are actually locked into.
  //
  // The guard is a ref, not the autoStarting state, and there is no
  // cleanup that cancels the request. An earlier version used both, and
  // the two combined to deadlock the page on "Starting..." every time:
  // setAutoStarting(true) changed a value this effect depended on, React
  // therefore tore the effect down and ran it again, the teardown flipped
  // the in-flight request's active flag to false, and the response was
  // then discarded on arrival. Nothing ever set the session, so no
  // participant using a role link could reach the questions. A ref does
  // not trigger a re-render, so the effect stays put while the request is
  // in flight. Found 7 September 2026 by the screenshot script, which is
  // the first thing to exercise this path end to end.
  const autoStartedRef = useRef(false);

  useEffect(() => {
    if (loading || !study || session || autoStartedRef.current || !roleFromLink) return;

    const activeRoles = settings?.active_roles_json || {};
    const activeRoleKeys = ROLE_KEYS.filter((roleKey) => activeRoles[roleKey] !== false);
    if (!activeRoleKeys.includes(roleFromLink)) return;

    autoStartedRef.current = true;
    setAutoStarting(true);

    supabase.rpc("start_tone_session", {
      p_study_id: study.id,
      p_participant_id: participantId,
      p_role: roleFromLink
    }).then(async ({ data, error }) => {
      setAutoStarting(false);

      if (error) {
        setMessage(error.message);
        return;
      }

      setSession(data);
      setSelectedRole(data.selected_role);
      await loadQuestionsForRole(study.id, data.selected_role);
    });
  }, [loading, study, session, settings, roleFromLink, participantId]);

  async function loadQuestionsForRole(studyId, roleKey) {
    setContentLoading(true);
    setQuestionsError("");
    const { data, error } = await supabase
      .from("tone_questions")
      .select("*")
      .eq("study_id", studyId)
      .eq("role_key", roleKey)
      .order("display_order");

    if (error) {
      setQuestionsError(error.message);
      setQuestions([]);
      setContentLoading(false);
      return;
    }

    setQuestions(
      (data || []).slice().sort(
        (a, b) => QUESTION_TYPE_ORDER.indexOf(a.question_type) - QUESTION_TYPE_ORDER.indexOf(b.question_type)
      )
    );
    setContentLoading(false);
  }

  async function chooseRole(roleKey) {
    setSelectedRole(roleKey);

    // For a participant this is only a selection; nothing happens until
    // they confirm, and after that the role is fixed. In preview the whole
    // point is to look at all three, so a click switches immediately and
    // clears whatever was answered as the previous role. Without this the
    // buttons stayed clickable, the highlight moved, the questions did
    // not, and the confirm button had already disappeared: an operator
    // could sit looking at Audience questions under a highlighted Editor.
    if (preview && session && roleKey !== session.selected_role) {
      setSession({ ...session, selected_role: roleKey });
      setRatingAnswers({});
      setGateAnswers({});
      setOpenAnswers({});
      setPreferredVariantId(null);
      setSubmitError("");
      if (study) await loadQuestionsForRole(study.id, roleKey);
    }
  }

  async function confirmRole() {
    if (!selectedRole || !study) return;

    // In preview the session is made here and goes no further than this
    // browser tab. It carries the same fields the real one does, so every
    // screen after this behaves identically. The variant order is the
    // stored order rather than a shuffled one, because a preview that
    // reordered itself on each visit would be harder to check against the
    // builder, and the panel it replaces said the same.
    if (preview) {
      setSession({
        id: null,
        selected_role: selectedRole,
        answer_count: 0,
        completed_at: null,
        assigned_variant_id: variants[0]?.id || null,
        variant_order_json: variants.map((variant) => variant.id),
        preferred_variant_id: null
      });
      setMessage("");
      await loadQuestionsForRole(study.id, selectedRole);
      return;
    }

    setStarting(true);
    setMessage("");

    const { data, error } = await supabase.rpc("start_tone_session", {
      p_study_id: study.id,
      p_participant_id: participantId,
      p_role: selectedRole
    });

    setStarting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setSession(data);
    setSelectedRole(data.selected_role);
    await loadQuestionsForRole(study.id, data.selected_role);
  }

  function setRating(questionId, variantId, value) {
    setRatingAnswers((current) => ({
      ...current,
      [questionId]: { ...current[questionId], [variantId]: value }
    }));
  }

  function setGate(questionId, variantId, field, value) {
    setGateAnswers((current) => ({
      ...current,
      [questionId]: {
        ...current[questionId],
        [variantId]: { ...(current[questionId]?.[variantId] || {}), [field]: value }
      }
    }));
  }

  function setOpen(questionId, value) {
    setOpenAnswers((current) => ({ ...current, [questionId]: value }));
  }

  // Named reasons rather than a single generic message, so a participant
  // sees exactly what is left rather than guessing. required is read per
  // question, not assumed from its type, because the builder lets a
  // creator's seeded required flag stay as it was set (Milestone 2 Step 3
  // edits wording only, not this flag, but the flag itself is data, not a
  // rule fixed to question_type).
  function findMissingRequired(shownVariants, questions) {
    const missing = [];

    questions.forEach((question) => {
      if (!question.required) return;

      if (question.question_type === "open") {
        if (!String(openAnswers[question.id] || "").trim()) {
          missing.push(question.question_text);
        }
        return;
      }

      shownVariants.forEach((variant, index) => {
        const label = shownVariants.length > 1 ? `${question.question_text} (wording ${index + 1})` : question.question_text;

        if (question.question_type === "rating") {
          if (!ratingAnswers[question.id]?.[variant.id]) missing.push(label);
        } else if (question.question_type === "gate") {
          if (!gateAnswers[question.id]?.[variant.id]?.status) missing.push(label);
        }
      });
    });

    return missing;
  }

  async function submitAll(shownVariants, questions) {
    const missing = findMissingRequired(shownVariants, questions);
    if (missing.length > 0) {
      setSubmitError(`Please answer: ${missing.join("; ")}.`);
      return;
    }

    // A preview stops here. The check above still runs, so the operator
    // finds out that a required question cannot be skipped, which is one
    // of the things worth knowing before sending a link out. Nothing is
    // written.
    if (preview) {
      setFinished(true);
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    for (const question of questions) {
      if (question.question_type === "open") {
        const value = String(openAnswers[question.id] || "").trim();
        if (!value) continue;
        const { error } = await supabase.rpc("submit_tone_response", {
          p_study_id: study.id,
          p_participant_id: participantId,
          p_question_id: question.id,
          p_variant_id: null,
          p_rating_value: null,
          p_text_value: value
        });
        if (error) {
          setSubmitting(false);
          setSubmitError(error.message);
          return;
        }
        continue;
      }

      for (const variant of shownVariants) {
        if (question.question_type === "rating") {
          const value = ratingAnswers[question.id]?.[variant.id];
          if (!value) continue;
          const isNotApplicable = value === "na";
          const { error } = await supabase.rpc("submit_tone_response", {
            p_study_id: study.id,
            p_participant_id: participantId,
            p_question_id: question.id,
            p_variant_id: variant.id,
            p_rating_value: isNotApplicable ? null : value,
            p_text_value: null,
            p_not_applicable: isNotApplicable
          });
          if (error) {
            setSubmitting(false);
            setSubmitError(error.message);
            return;
          }
        } else if (question.question_type === "gate") {
          const answer = gateAnswers[question.id]?.[variant.id];
          if (!answer?.status) continue;
          const { error } = await supabase.rpc("submit_tone_gate_response", {
            p_study_id: study.id,
            p_participant_id: participantId,
            p_question_id: question.id,
            p_gate_status: answer.status,
            p_variant_id: variant.id,
            p_comment: answer.comment || null
          });
          if (error) {
            setSubmitting(false);
            setSubmitError(error.message);
            return;
          }
        }
      }
    }

    const { error: completeError } = await supabase.rpc("complete_tone_session", {
      p_study_id: study.id,
      p_participant_id: participantId,
      p_preferred_variant_id: preferredVariantId
    });

    setSubmitting(false);

    if (completeError) {
      setSubmitError(completeError.message);
      return;
    }

    setFinished(true);
  }

  if (loading) {
    return (
      <div className="page-shell">
        <main className="container narrow">
          <section className="card">Loading...</section>
        </main>
      </div>
    );
  }

  if (!study) {
    return (
      <div className="page-shell">
        <main className="container narrow">
          <section className="card">
            <h1>Test unavailable</h1>
            <p>{message}</p>
          </section>
        </main>
      </div>
    );
  }

  if (study.status === "closed" || (study.status === "published" && isPastExpiry(study.expires_at))) {
    return (
      <div className="page-shell">
        <main className="container narrow">
          <section className="card done-card">
            <h1>Sorry, this test is now closed.</h1>
            <p>Do not worry. If you want to take part, please contact the person who shared this test with you.</p>
          </section>
        </main>
      </div>
    );
  }

  if (study.status !== "published") {
    return (
      <div className="page-shell">
        <main className="container narrow">
          <section className="card">
            <h1>Test unavailable</h1>
            <p>This test link is not available.</p>
          </section>
        </main>
      </div>
    );
  }

  if (finished) {
    // The same ending as a tree test, through the same component. A tone
    // test used to finish on a bare card with two lines of text while a
    // tree test finished with a tick and a heading, so the platform said
    // goodbye two different ways depending on which test someone had been
    // sent. Reported by the operator on 7 September 2026.
    return (
      <div className="page-shell">
        <main className="container narrow">
          {preview ? <PreviewBanner builderPath={`/tone-builder/${study.id}`} /> : null}
          {preview ? (
            <DoneCard heading="Preview complete" paragraphs={["Responses were not saved."]}>
              <div className="button-row action-center">
                <a className="primary-button" href={`/tone-builder/${study.id}`}>Back to editor</a>
                <a className="secondary-button" href="/admin">Back to test collection</a>
              </div>
            </DoneCard>
          ) : (
            <DoneCard
              heading="Thank you"
              paragraphs={study.end_text?.length ? study.end_text : ["You have completed the test."]}
            />
          )}
        </main>
      </div>
    );
  }

  const activeRoles = settings?.active_roles_json || {};
  const activeRoleKeys = ROLE_KEYS.filter((roleKey) => activeRoles[roleKey] !== false);
  const roleIsLocked = Boolean(session?.answer_count > 0);
  const variantMode = settings?.variant_mode || "single_random";

  // Which wording this participant sees, decided once by start_tone_session
  // and stored on the session, not recomputed here. In single mode this is
  // exactly one variant; in compare-all mode it is every variant, in the
  // order fixed for this participant.
  const shownVariants = (() => {
    if (!session) return [];
    if (variantMode === "compare_all") {
      const order = Array.isArray(session.variant_order_json) ? session.variant_order_json : [];
      return order.map((id) => variants.find((variant) => variant.id === id)).filter(Boolean);
    }
    const assigned = variants.find((variant) => variant.id === session.assigned_variant_id);
    return assigned ? [assigned] : [];
  })();

  return (
    <div className="page-shell">
      <main className="container narrow">
        {preview ? <PreviewBanner builderPath={`/tone-builder/${study.id}`} /> : null}
        <section className="card hero-card">
          <span className="badge">Tone Test</span>
          <h1>{study.title}</h1>
          {(study.welcome_text || []).map((text, index) => <p key={index}>{text}</p>)}
          <div className="privacy-card">
            <h2>Privacy</h2>
            <ul>{(study.privacy_text || []).map((text, index) => <li key={index}>{text}</li>)}</ul>
          </div>
        </section>

        {roleFromLink && (session || autoStarting) ? (
          <section className="card">
            <h2>Your role</h2>
            <p className="muted-text">
              {autoStarting
                ? "Starting..."
                : <>You are answering as <strong>{ROLE_LABELS[selectedRole || roleFromLink]}</strong>.</>}
            </p>
            {message ? <p className="error-box">{message}</p> : null}
          </section>
        ) : (
          <section className="card">
            <h2>{preview ? "Preview as which role" : "Choose your role"}</h2>
            <p className="muted-text">
              {preview
                ? "Switch freely to see each role's questions. A participant chooses once and is then fixed for the rest of the test."
                : roleIsLocked
                  ? "You already started answering as this role, so it is fixed for the rest of this test."
                  : "Pick the role that best describes why you are reviewing this wording."}
            </p>

            {activeRoleKeys.length === 0 ? (
              <p className="error-box">This test has no active roles to answer as yet.</p>
            ) : (
              <div role="radiogroup" aria-label="Choose your role">
                {activeRoleKeys.map((roleKey) => {
                  const isSelected = selectedRole === roleKey;
                  return (
                    <button
                      key={roleKey}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      className={isSelected ? "primary-button" : "secondary-button"}
                      disabled={roleIsLocked && !isSelected}
                      onClick={() => chooseRole(roleKey)}
                      style={{ display: "block", width: "100%", textAlign: "left", marginBottom: "8px" }}
                    >
                      <strong>{ROLE_LABELS[roleKey]}</strong>
                      <div className="muted-text">{ROLE_DESCRIPTIONS[roleKey]}</div>
                    </button>
                  );
                })}
              </div>
            )}

            {message ? <p className="error-box">{message}</p> : null}

            {!session ? (
              <div className="button-row">
                <button
                  className="primary-button"
                  disabled={!selectedRole || starting || activeRoleKeys.length === 0}
                  onClick={confirmRole}
                >
                  {starting ? "Starting..." : "Confirm and start"}
                </button>
              </div>
            ) : null}
          </section>
        )}

        {session ? (
          <>
            {/* Stays at the top of the screen while the questions scroll
                underneath, so the wording being judged is always in view.
                Pinned whether collapsed or expanded.

                It used to release when expanded, on the reasoning that a
                long wording should not become a pinned block with its own
                scrollbar. That got it backwards: expanding is what a
                participant does when they want to keep reading the wording
                while they answer, so releasing it at that moment takes the
                text away exactly when it is wanted. Changed 7 September 2026
                on the operator's call. The original worry is handled by
                capping the expanded text's height rather than by unpinning
                the bar. */}
            <section className="card tone-wording-bar tone-wording-bar-pinned">
              {contentLoading ? (
                <p className="muted-text">Loading...</p>
              ) : shownVariants.length === 0 ? (
                <p className="error-box">No wording is available for this test yet.</p>
              ) : (
                <>
                  <div className="tone-wording-bar-head">
                    <h2>Wording</h2>

                    {/* These switch which wording is on show rather than
                        answering anything, so they are tabs, not radios. The
                        type tabs in StudyListPage.jsx already use this
                        pattern. Audit finding C1. */}
                    {shownVariants.length > 1 ? (
                      <div className="tone-wording-tabs" role="tablist" aria-label="Which wording to show">
                        {shownVariants.map((variant, index) => (
                          <button
                            key={variant.id}
                            type="button"
                            role="tab"
                            aria-selected={index === activeWordingIndex}
                            className={index === activeWordingIndex ? "view-toggle-button view-toggle-button-active" : "view-toggle-button"}
                            onClick={() => setActiveWordingIndex(index)}
                          >
                            Wording {index + 1}
                          </button>
                        ))}
                      </div>
                    ) : null}

                    <button
                      type="button"
                      className="text-link text-link-button"
                      onClick={() => setWordingExpanded((current) => !current)}
                    >
                      {wordingExpanded ? "Show less" : "Show full wording"}
                    </button>
                  </div>

                  <p className={wordingExpanded ? "tone-wording-text tone-wording-text-expanded" : "tone-wording-text tone-wording-text-clamped"}>
                    {(shownVariants[activeWordingIndex] || shownVariants[0])?.variant_text}
                  </p>
                </>
              )}
            </section>

        {!contentLoading ? (
          <section className="card">
            <h2>Questions</h2>
            {questionsError ? (
              <p className="error-box">Could not load questions: {questionsError}</p>
            ) : questions.length === 0 ? (
              <p className="muted-text">No questions found for this role.</p>
            ) : (
              questions.map((question) => {
                if (question.question_type === "open") {
                  return (
                    <div className="question-card" key={question.id}>
                      <label className="form-block">
                        <span className="form-label">
                          {question.question_text}
                          {!question.required ? " (optional)" : ""}
                        </span>
                        <textarea
                          className="textarea"
                          value={openAnswers[question.id] || ""}
                          onChange={(event) => setOpen(question.id, event.target.value)}
                        />
                      </label>
                    </div>
                  );
                }

                // Rating and gate questions are asked once per shown
                // variant, since both are a judgement about specific
                // wording. In single-variant mode this is just one block.
                return (
                  <div className="question-card" key={question.id}>
                    <p className="form-label">{question.question_text}</p>
                    {shownVariants.map((variant, index) => (
                      <div key={variant.id} style={{ marginBottom: "12px" }}>
                        {variantMode === "compare_all" ? (
                          <p className="muted-text">For wording {index + 1}</p>
                        ) : null}

                        {question.question_type === "rating" ? (
                          <div>
                            {/* Six buttons that look like a scale to a sighted
                                participant were six unrelated buttons to a
                                screen reader: nothing said they belonged
                                together, that only one could be chosen, which
                                question they answered, or which one was
                                chosen, because the choice showed as colour
                                only. As a radiogroup they announce all four.
                                Audit findings C1 and C2. */}
                            <div
                              className="button-row"
                              role="radiogroup"
                              aria-label={
                                variantMode === "compare_all"
                                  ? `${question.question_text} For wording ${index + 1}`
                                  : question.question_text
                              }
                            >
                              {[1, 2, 3, 4, 5].map((value) => (
                                <button
                                  key={value}
                                  type="button"
                                  role="radio"
                                  aria-checked={ratingAnswers[question.id]?.[variant.id] === value}
                                  className={ratingAnswers[question.id]?.[variant.id] === value ? "primary-button" : "secondary-button"}
                                  onClick={() => setRating(question.id, variant.id, value)}
                                >
                                  {value}
                                </button>
                              ))}
                              <button
                                type="button"
                                role="radio"
                                aria-checked={ratingAnswers[question.id]?.[variant.id] === "na"}
                                className={ratingAnswers[question.id]?.[variant.id] === "na" ? "primary-button" : "secondary-button"}
                                onClick={() => setRating(question.id, variant.id, "na")}
                              >
                                Not applicable
                              </button>
                            </div>
                            <div className="rating-scale-labels">
                              <span>1 = Strongly disagree</span>
                              <span>5 = Strongly agree</span>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div
                              className="button-row"
                              role="radiogroup"
                              aria-label={
                                variantMode === "compare_all"
                                  ? `${question.question_text} For wording ${index + 1}`
                                  : question.question_text
                              }
                            >
                              {GATE_STATUS_OPTIONS.map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  role="radio"
                                  aria-checked={gateAnswers[question.id]?.[variant.id]?.status === option.value}
                                  className={gateAnswers[question.id]?.[variant.id]?.status === option.value ? "primary-button" : "secondary-button"}
                                  onClick={() => setGate(question.id, variant.id, "status", option.value)}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                            <textarea
                              className="textarea"
                              placeholder="Comment (optional)"
                              value={gateAnswers[question.id]?.[variant.id]?.comment || ""}
                              onChange={(event) => setGate(question.id, variant.id, "comment", event.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })
            )}

            {variantMode === "compare_all" && shownVariants.length > 1 ? (
              <div className="question-card">
                <p className="form-label">Which wording did you prefer?</p>
                <div className="button-row" role="radiogroup" aria-label="Which wording did you prefer?">
                  {shownVariants.map((variant, index) => (
                    <button
                      key={variant.id}
                      type="button"
                      role="radio"
                      aria-checked={preferredVariantId === variant.id}
                      className={preferredVariantId === variant.id ? "primary-button" : "secondary-button"}
                      onClick={() => setPreferredVariantId(variant.id)}
                    >
                      Wording {index + 1}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {submitError ? <p className="error-box">{submitError}</p> : null}

            <div className="button-row">
              <button
                className="primary-button"
                disabled={submitting || questions.length === 0}
                onClick={() => submitAll(shownVariants, questions)}
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </section>
        ) : null}
          </>
        ) : null}
      </main>
    </div>
  );
}
