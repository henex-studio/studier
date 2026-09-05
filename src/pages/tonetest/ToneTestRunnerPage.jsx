import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { getParticipantId } from "../../lib/participantId";
import { ROLE_KEYS, ROLE_LABELS, ROLE_DESCRIPTIONS } from "../../lib/tonetest/defaultQuestions";

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
export default function ToneTestRunnerPage({ slug }) {
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
      const { data: studyData, error: studyError } = await supabase
        .from("studies")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!active) return;

      if (studyError || !studyData) {
        setMessage("This test link is not available.");
        setLoading(false);
        return;
      }

      setStudy(studyData);

      if (studyData.status !== "published") {
        setLoading(false);
        return;
      }

      const { data: settingsData } = await supabase
        .from("tone_test_settings")
        .select("*")
        .eq("study_id", studyData.id)
        .maybeSingle();

      if (!active) return;
      setSettings(settingsData);

      const { data: variantRows } = await supabase
        .from("tone_variants")
        .select("*")
        .eq("study_id", studyData.id)
        .order("display_order");

      if (!active) return;
      setVariants(variantRows || []);

      // Reopening the link on the same browser returns to whatever session
      // already exists, using the participant identifier the existing
      // browser-side code already generates and stores, rather than
      // starting a second one.
      const pid = getParticipantId(studyData.id);
      const { data: sessionData } = await supabase.rpc("get_tone_session", {
        p_study_id: studyData.id,
        p_participant_id: pid
      });

      if (!active) return;

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
  useEffect(() => {
    if (loading || !study || session || autoStarting || !roleFromLink) return;

    const activeRoles = settings?.active_roles_json || {};
    const activeRoleKeys = ROLE_KEYS.filter((roleKey) => activeRoles[roleKey] !== false);
    if (!activeRoleKeys.includes(roleFromLink)) return;

    let active = true;
    setAutoStarting(true);

    supabase.rpc("start_tone_session", {
      p_study_id: study.id,
      p_participant_id: participantId,
      p_role: roleFromLink
    }).then(async ({ data, error }) => {
      if (!active) return;
      setAutoStarting(false);

      if (error) {
        setMessage(error.message);
        return;
      }

      setSession(data);
      setSelectedRole(data.selected_role);
      await loadQuestionsForRole(study.id, data.selected_role);
    });

    return () => { active = false; };
  }, [loading, study, session, settings, autoStarting, roleFromLink, participantId]);

  async function loadQuestionsForRole(studyId, roleKey) {
    setContentLoading(true);
    const { data } = await supabase
      .from("tone_questions")
      .select("*")
      .eq("study_id", studyId)
      .eq("role_key", roleKey)
      .order("display_order");

    setQuestions(
      (data || []).slice().sort(
        (a, b) => QUESTION_TYPE_ORDER.indexOf(a.question_type) - QUESTION_TYPE_ORDER.indexOf(b.question_type)
      )
    );
    setContentLoading(false);
  }

  function chooseRole(roleKey) {
    setSelectedRole(roleKey);
  }

  async function confirmRole() {
    if (!selectedRole || !study) return;
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
    return (
      <div className="page-shell">
        <main className="container narrow">
          <section className="card done-card">
            {(study.end_text?.length ? study.end_text : ["You have completed the test.", "Thank you for your feedback."]).map(
              (text, index) => <p key={index}>{text}</p>
            )}
          </section>
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
            <h2>Choose your role</h2>
            <p className="muted-text">
              {roleIsLocked
                ? "You already started answering as this role, so it is fixed for the rest of this test."
                : "Pick the role that best describes why you are reviewing this wording."}
            </p>

            {activeRoleKeys.length === 0 ? (
              <p className="error-box">This test has no active roles to answer as yet.</p>
            ) : (
              <div>
                {activeRoleKeys.map((roleKey) => {
                  const isSelected = selectedRole === roleKey;
                  return (
                    <button
                      key={roleKey}
                      type="button"
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
                Collapsed it shows two lines and stays pinned; expanded it
                releases and scrolls with the page, so a long wording never
                becomes a pinned block with its own scrollbar. */}
            <section className={wordingExpanded ? "card tone-wording-bar" : "card tone-wording-bar tone-wording-bar-pinned"}>
              {contentLoading ? (
                <p className="muted-text">Loading...</p>
              ) : shownVariants.length === 0 ? (
                <p className="error-box">No wording is available for this test yet.</p>
              ) : (
                <>
                  <div className="tone-wording-bar-head">
                    <h2>Wording</h2>

                    {shownVariants.length > 1 ? (
                      <div className="tone-wording-tabs">
                        {shownVariants.map((variant, index) => (
                          <button
                            key={variant.id}
                            type="button"
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

                  <p className={wordingExpanded ? "tone-wording-text" : "tone-wording-text tone-wording-text-clamped"}>
                    {(shownVariants[activeWordingIndex] || shownVariants[0])?.variant_text}
                  </p>
                </>
              )}
            </section>

        {!contentLoading ? (
          <section className="card">
            <h2>Questions</h2>
            {questions.length === 0 ? (
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
                            <div className="button-row">
                              {[1, 2, 3, 4, 5].map((value) => (
                                <button
                                  key={value}
                                  type="button"
                                  className={ratingAnswers[question.id]?.[variant.id] === value ? "primary-button" : "secondary-button"}
                                  onClick={() => setRating(question.id, variant.id, value)}
                                >
                                  {value}
                                </button>
                              ))}
                              <button
                                type="button"
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
                            <div className="button-row">
                              {GATE_STATUS_OPTIONS.map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
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
                <div className="button-row">
                  {shownVariants.map((variant, index) => (
                    <button
                      key={variant.id}
                      type="button"
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
