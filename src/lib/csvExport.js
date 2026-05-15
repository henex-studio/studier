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
