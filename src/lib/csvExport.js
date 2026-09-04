export function csvEscape(value) {
  const text = Array.isArray(value) || typeof value === "object" ? JSON.stringify(value ?? "") : String(value ?? "");
  if (text.includes(",") || text.includes("\n") || text.includes('"')) return '"' + text.replaceAll('"', '""') + '"';
  return text;
}

export function buildTaskCsv(results) {
  const headers = [
    "study_id", "participant_id", "task_id", "task_order", "task_text", "selected_path", "skipped", "target_path", "target_paths", "acceptable_paths", "match_type", "is_correct", "first_click_path", "click_history", "depth", "click_count", "backtrack_count", "hesitation_flag", "time_seconds", "submitted_at", "updated_at"
  ];
  return [headers.join(","), ...results.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n");
}

export function buildFinalCsv(results, questions = []) {
  const questionKeys = questions.map((question) => question.question_key);
  const headers = ["study_id", "participant_id", ...questionKeys, "submitted_at", "updated_at"];
  const rows = results.map((row) => {
    const answers = row.final_answers || {};
    return [row.study_id, row.participant_id, ...questionKeys.map((key) => answers[key] || ""), row.submitted_at, row.updated_at];
  });
  return [headers.join(","), ...rows.map((row) => row.map((cell) => csvEscape(cell)).join(","))].join("\n");
}

// --- Tone Test ---------------------------------------------------------
// Two exports, matching the split Tree Test already uses: one row per
// stored answer for anyone reanalysing outside the tool, and one row per
// wording carrying the numbers the dashboard shows.

function toneRowsFrom({ responses, gateResponses, sessionsById, questionsById, variantsById }) {
  const label = (map, id, field) => (id ? map.get(id)?.[field] || "" : "");

  const ratingRows = responses.map((response) => ({
    participant_id: label(sessionsById, response.session_id, "participant_id"),
    role: label(sessionsById, response.session_id, "selected_role"),
    variant: label(variantsById, response.variant_id, "label"),
    question: label(questionsById, response.question_id, "question_text"),
    question_type: label(questionsById, response.question_id, "question_type"),
    rating_value: response.not_applicable ? "" : (response.rating_value ?? ""),
    not_applicable: response.not_applicable ? "yes" : "",
    gate_status: "",
    comment_or_text: response.text_value || "",
    submitted_at: response.submitted_at
  }));

  const gateRows = gateResponses.map((response) => ({
    participant_id: label(sessionsById, response.session_id, "participant_id"),
    role: label(sessionsById, response.session_id, "selected_role"),
    variant: label(variantsById, response.variant_id, "label"),
    question: label(questionsById, response.question_id, "question_text"),
    question_type: "gate",
    rating_value: "",
    not_applicable: "",
    gate_status: response.gate_status,
    comment_or_text: response.comment || "",
    submitted_at: response.submitted_at
  }));

  return [...ratingRows, ...gateRows].sort((a, b) =>
    String(a.participant_id).localeCompare(String(b.participant_id)) ||
    String(a.submitted_at).localeCompare(String(b.submitted_at))
  );
}

export function buildToneResponsesCsv(input) {
  const headers = [
    "participant_id", "role", "variant", "question", "question_type",
    "rating_value", "not_applicable", "gate_status", "comment_or_text", "submitted_at"
  ];
  const rows = toneRowsFrom(input);
  return [headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n");
}

// variantResults is what ToneDashboardPage already computed and displayed.
// Passing it in rather than recomputing here is deliberate: a second
// implementation of the scoring rules is a second thing to keep correct,
// and the two would drift.
export function buildToneResultsCsv(variantResults, roleKeys) {
  const headers = [
    "variant", "wording", "content_score", "evidence_confidence", "evidence_warning",
    ...roleKeys.flatMap((role) => [`${role}_score`, `${role}_responses`]),
    "gate_policy_accuracy", "gate_safety_risk", "gate_privacy_consent",
    "gate_harm_blame_stigma", "gate_operational_promise", "gate_accessibility_readability",
    "blame_flag", "recommendation", "recommendation_reason", "preferred_count"
  ];

  const rows = variantResults.map(({ variant, result, blameFlagged, preferredCount }) => {
    const gate = (key) => result.gateStatuses.find((entry) => entry.key === key)?.status || "";
    const group = (role) => result.groupScores.find((entry) => entry.role === role);
    return [
      variant.label || "",
      variant.variant_text || "",
      result.contentScore === null ? "" : result.contentScore,
      result.evidence.level,
      result.evidence.warning ? "yes" : "",
      ...roleKeys.flatMap((role) => {
        const entry = group(role);
        return [entry?.score === null || entry === undefined ? "" : Math.round(entry.score * 10) / 10, entry?.responseCount ?? ""];
      }),
      gate("policy_accuracy"), gate("safety_risk"), gate("privacy_consent"),
      gate("harm_blame_stigma"), gate("operational_promise"), gate("accessibility_readability"),
      blameFlagged ? "yes" : "",
      result.recommendation.status,
      result.recommendation.reason,
      preferredCount ?? ""
    ];
  });

  return [headers.join(","), ...rows.map((row) => row.map((cell) => csvEscape(cell)).join(","))].join("\n");
}

export function downloadCsv(filename, csvText) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}
