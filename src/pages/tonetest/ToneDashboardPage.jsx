import React, { useEffect, useState } from "react";
import AdminShell from "../../components/AdminShell";
import { supabase } from "../../lib/supabase";
import { ROLE_LABELS, GATES } from "../../lib/tonetest/defaultQuestions";
import { WEIGHT_GROUPS } from "../../lib/tonetest/weights";
import { buildToneResponsesCsv, buildToneResultsCsv, downloadCsv } from "../../lib/csvExport";
import {
  computeVariantResult,
  computeBlameFlag,
  RECOMMENDATION_LABELS,
  DEFAULT_BLAME_FLAG_THRESHOLD,
  BLAME_QUESTION_ROLE,
  BLAME_QUESTION_DISPLAY_ORDER
} from "../../lib/tonetest/scoring";

const GATE_STATUS_LABELS = {
  pass: "Pass",
  concern: "Concern",
  fail: "Fail",
  not_covered: "Not covered"
};

const GATE_STATUS_CLASS = {
  pass: "success-box",
  concern: "unsaved-changes-note",
  fail: "error-box",
  not_covered: "muted-text"
};

// Distinct participant sessions with at least one real (non "not
// applicable") rating for the given role and variant. Milestone 4 Step 1's
// comment on computeEvidenceConfidence explains why this counts people
// rather than individual rating answers.
function countParticipantsForRole(responses, questionsById, role, variantId) {
  const sessionIds = new Set();
  responses.forEach((response) => {
    if (response.variant_id !== variantId) return;
    if (response.not_applicable || response.rating_value === null) return;
    const question = questionsById.get(response.question_id);
    if (!question || question.question_type !== "rating" || question.role_key !== role) return;
    sessionIds.add(response.session_id);
  });
  return sessionIds.size;
}

function ratingsForRole(responses, questionsById, role, variantId) {
  return responses
    .filter((response) => {
      if (response.variant_id !== variantId) return false;
      if (response.not_applicable || response.rating_value === null) return false;
      const question = questionsById.get(response.question_id);
      return question && question.question_type === "rating" && question.role_key === role;
    })
    .map((response) => response.rating_value);
}

function gatesByKeyForVariant(gateResponses, variantId) {
  const byKey = {};
  gateResponses
    .filter((response) => response.variant_id === variantId)
    .forEach((response) => {
      if (!byKey[response.gate_key]) byKey[response.gate_key] = [];
      byKey[response.gate_key].push(response);
    });
  return byKey;
}

// The blame question has no stable key (see scoring.js). Found by role and
// its fixed seed position, which the builder does not currently let a
// creator change.
function findBlameQuestion(questions) {
  const candidates = questions
    .filter((question) => question.role_key === BLAME_QUESTION_ROLE && question.question_type === "rating")
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  return candidates[BLAME_QUESTION_DISPLAY_ORDER] || null;
}

function meanOf(values) {
  if (!values || values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export default function ToneDashboardPage({ profile, studyId }) {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [study, setStudy] = useState(null);
  const [settings, setSettings] = useState(null);
  const [variants, setVariants] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [responses, setResponses] = useState([]);
  const [gateResponses, setGateResponses] = useState([]);

  async function load() {
    setLoading(true);

    const { data: studyData, error: studyError } = await supabase
      .from("studies")
      .select("*")
      .eq("id", studyId)
      .single();

    if (studyError || !studyData) {
      setMessage(studyError?.message || "This study could not be loaded.");
      setLoading(false);
      return;
    }
    setStudy(studyData);

    const [{ data: settingsData }, { data: variantData }, { data: questionData }] = await Promise.all([
      supabase.from("tone_test_settings").select("*").eq("study_id", studyId).maybeSingle(),
      supabase.from("tone_variants").select("*").eq("study_id", studyId).order("display_order"),
      supabase.from("tone_questions").select("*").eq("study_id", studyId).order("display_order")
    ]);
    setSettings(settingsData || null);
    setVariants(variantData || []);
    setQuestions(questionData || []);

    // Owner or admin only. RLS was written in Milestone 3 Step 1 and only
    // ever exercised by the database owner until Milestone 4 Step 2, which
    // checked this for real: a signed-in owner can read their own study's
    // rows here, and a signed-in user who owns a different study cannot.
    const [{ data: sessionData }, { data: responseData }, { data: gateData }] = await Promise.all([
      supabase.from("tone_sessions").select("*").eq("study_id", studyId),
      supabase.from("tone_responses").select("*").eq("study_id", studyId),
      supabase.from("tone_gate_responses").select("*").eq("study_id", studyId)
    ]);
    setSessions(sessionData || []);
    setResponses(responseData || []);
    setGateResponses(gateData || []);

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [studyId]);

  if (loading) {
    return <AdminShell profile={profile}><section className="card">Loading...</section></AdminShell>;
  }

  if (!study) {
    return <AdminShell profile={profile}><section className="card error-box">{message || "Not found."}</section></AdminShell>;
  }

  const activeRoles = settings?.active_roles_json || {};
  const weights = settings?.content_score_weights_json || {};
  const blameThreshold = settings?.blame_flag_threshold ?? DEFAULT_BLAME_FLAG_THRESHOLD;
  const questionsById = new Map(questions.map((question) => [question.id, question]));
  const blameQuestion = findBlameQuestion(questions);
  const activeRoleKeys = WEIGHT_GROUPS.filter((group) => activeRoles[group.role] !== false).map((group) => group.role);

  const startedCount = sessions.length;
  const completedCount = sessions.filter((session) => session.completed_at).length;
  const sessionsByRole = {};
  sessions.forEach((session) => {
    sessionsByRole[session.selected_role] = (sessionsByRole[session.selected_role] || 0) + 1;
  });

  // One full scoring pass per variant. Nothing here writes to the
  // database; this is read-only, recomputed on every load, so there is
  // never a stored score to fall out of sync with the responses behind it.
  const variantResults = variants.map((variant) => {
    const ratingsByRole = {};
    const participantCountsByRole = {};
    WEIGHT_GROUPS.forEach((group) => {
      ratingsByRole[group.role] = ratingsForRole(responses, questionsById, group.role, variant.id);
      participantCountsByRole[group.role] = countParticipantsForRole(responses, questionsById, group.role, variant.id);
    });

    const result = computeVariantResult({
      activeRoles,
      weights,
      ratingsByRole,
      participantCountsByRole,
      gateResponsesByKey: gatesByKeyForVariant(gateResponses, variant.id),
      blameFlagThreshold: blameThreshold
    });

    const blameMean = blameQuestion
      ? meanOf(
          responses
            .filter(
              (response) =>
                response.variant_id === variant.id &&
                response.question_id === blameQuestion.id &&
                !response.not_applicable &&
                response.rating_value !== null
            )
            .map((response) => response.rating_value)
        )
      : null;
    const blameFlagged = computeBlameFlag(blameMean, blameThreshold);

    const gateComments = gateResponses.filter((response) => response.variant_id === variant.id && response.comment);

    const preferredCount = sessions.filter((session) => session.preferred_variant_id === variant.id).length;

    return { variant, result, blameMean, blameFlagged, gateComments, preferredCount };
  });

  const variantMode = settings?.variant_mode || "single_random";

  // Open questions are answered once per session, not once per variant
  // (Milestone 3's own design decision, since the questions read as
  // reflective rather than about one specific wording). The Milestone 4
  // plan asked for comments grouped by role and by variant; that turned
  // out not to be possible for open comments specifically, since the data
  // carries no variant at all, only null. Shown once here, grouped by
  // role, rather than duplicated under every variant card implying an
  // association the data does not have. Gate comments genuinely are
  // per-variant, since a gate question is asked once per shown wording,
  // and stay inside each variant's card below.
  const openAnswersByQuestion = questions
    .filter((question) => question.question_type === "open")
    .map((question) => ({
      question,
      answers: responses.filter((response) => response.question_id === question.id && String(response.text_value || "").trim())
    }))
    .filter((entry) => entry.answers.length > 0);

  return (
    <AdminShell profile={profile}>
      <section className="card admin-header">
        <div>
          <span className="type-badge type-badge-tone">Tone Test</span>
          <h1>{study.title}</h1>
          <p>Results</p>
        </div>
        <div className="admin-actions">
          <button className="secondary-button" onClick={load}>Refresh</button>
          <button
            className="secondary-button"
            onClick={() => downloadCsv("studier-tone-responses.csv", buildToneResponsesCsv({
              responses,
              gateResponses,
              sessionsById: new Map(sessions.map((session) => [session.id, session])),
              questionsById,
              variantsById: new Map(variants.map((variant) => [variant.id, variant]))
            }))}
          >
            Export responses CSV
          </button>
          <button
            className="secondary-button"
            onClick={() => downloadCsv("studier-tone-results.csv", buildToneResultsCsv(variantResults, activeRoleKeys))}
          >
            Export results CSV
          </button>
        </div>
      </section>

      <section className="summary-grid">
        <div className="summary-card"><p>Sessions started</p><strong>{startedCount}</strong></div>
        <div className="summary-card"><p>Sessions completed</p><strong>{completedCount}</strong></div>
        {WEIGHT_GROUPS.filter((group) => activeRoles[group.role] !== false).map((group) => (
          <div className="summary-card" key={group.role}>
            <p>{ROLE_LABELS[group.role]} sessions</p>
            <strong>{sessionsByRole[group.role] || 0}</strong>
          </div>
        ))}
      </section>

      {variants.length === 0 ? (
        <section className="card"><p className="muted-text">No wording variants on this test.</p></section>
      ) : (
        variantResults.map(({ variant, result, blameMean, blameFlagged, gateComments, preferredCount }) => (
          <section className="card" key={variant.id}>
            <div className="collection-header-row">
              <div>
                <h2>{variant.label || "Wording"}</h2>
                <p className="muted-text">{variant.variant_text}</p>
              </div>
              {variantMode === "compare_all" ? (
                <div className="owner-chip owner-chip-3">{preferredCount} preferred this wording</div>
              ) : null}
            </div>

            <div className="summary-grid">
              <div className="summary-card">
                <p>Content Score</p>
                <strong>{result.contentScore === null ? "No data" : result.contentScore}</strong>
              </div>
              <div className="summary-card">
                <p>Evidence Confidence</p>
                <strong>{result.evidence.level}</strong>
              </div>
              <div className="summary-card">
                <p>Recommendation</p>
                <strong style={{ fontSize: "16px" }}>{RECOMMENDATION_LABELS[result.recommendation.status]}</strong>
              </div>
            </div>

            {result.evidence.warning ? (
              <p className="unsaved-changes-note">At least one active role has fewer than 3 responses for this wording. This does not block anything, but read the score with that in mind.</p>
            ) : null}

            <p className="muted-text">{result.recommendation.reason}</p>

            <h3>Score by role</h3>
            <div className="settings-list">
              {result.groupScores.map((group) => (
                <div className="setting-card" key={group.key}>
                  <div className="setting-main-row">
                    <span className="setting-label">{ROLE_LABELS[group.role]}</span>
                    <span className="muted-text">
                      {!group.active
                        ? "Role turned off for this test"
                        : group.score === null
                          ? "No responses yet"
                          : `${Math.round(group.score * 10) / 10} from ${group.responseCount} ${group.responseCount === 1 ? "person" : "people"} (weight ${group.weight})`}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <h3>Risk gates</h3>
            <div className="settings-list">
              {result.gateStatuses.map((gate) => (
                <div className="setting-card" key={gate.key}>
                  <div className="setting-main-row">
                    <span className="setting-label">{gate.label}{gate.critical ? " (critical)" : ""}</span>
                    <span className={GATE_STATUS_CLASS[gate.status]} style={{ padding: "2px 10px", borderRadius: "999px" }}>
                      {GATE_STATUS_LABELS[gate.status]}
                    </span>
                  </div>
                  {gate.key === "harm_blame_stigma" && blameFlagged ? (
                    <p className="setting-description" style={{ color: "#b91c1c" }}>
                      Flagged: the Audience's average on "This message does not make me feel blamed" is
                      {" "}{blameMean === null ? "unavailable" : (Math.round(blameMean * 100) / 100)}, below this test's threshold of {blameThreshold}.
                      This is a prompt to look, not a judgement already made.
                    </p>
                  ) : null}
                </div>
              ))}
            </div>

            {gateComments.length > 0 ? (
              <>
                <h3>Gate comments</h3>
                <div className="settings-list">
                  {gateComments.map((comment) => {
                    const gate = GATES.find((candidate) => candidate.key === comment.gate_key);
                    return (
                      <div className="setting-card" key={comment.id}>
                        <span className="setting-label">{gate?.label || comment.gate_key}</span>
                        <p className="setting-description">{comment.comment}</p>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : null}

          </section>
        ))
      )}

      {openAnswersByQuestion.length > 0 ? (
        <section className="card">
          <h2>Open comments</h2>
          <p className="muted-text">
            Answered once per participant, not once per wording, so these are not tied to a specific variant even
            in a test that compares more than one.
          </p>
          <div className="settings-list">
            {openAnswersByQuestion.map((entry) => (
              <div className="setting-card" key={entry.question.id}>
                <span className="setting-label">{ROLE_LABELS[entry.question.role_key]}: {entry.question.question_text}</span>
                {entry.answers.map((answer) => (
                  <p className="setting-description" key={answer.id}>{answer.text_value}</p>
                ))}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </AdminShell>
  );
}
