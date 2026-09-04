// Milestone 5 Step 4. Runs the real CSV builders over a small fixture that
// covers the cases most likely to break a spreadsheet: a "not applicable"
// answer, a gate answer with a comment, an open text answer with a comma
// and a quote in it, and a variant nobody answered.
//
// Run with: node scripts/verify-tone-csv.mjs

import { buildToneResponsesCsv, buildToneResultsCsv } from "../src/lib/csvExport.js";

const sessionsById = new Map([
  ["s1", { id: "s1", participant_id: "P001", selected_role: "audience" }],
  ["s2", { id: "s2", participant_id: "P002", selected_role: "agency" }]
]);

const questionsById = new Map([
  ["q1", { id: "q1", question_text: "This message is clear.", question_type: "rating" }],
  ["q2", { id: "q2", question_text: "What felt unclear?", question_type: "open" }],
  ["q3", { id: "q3", question_text: "Is this accurate against policy?", question_type: "gate" }]
]);

const variantsById = new Map([
  ["v1", { id: "v1", label: "Plain", variant_text: "Your licence expires soon." }],
  ["v2", { id: "v2", label: "Formal", variant_text: "Your licence is due to expire." }]
]);

const responses = [
  { session_id: "s1", question_id: "q1", variant_id: "v1", rating_value: 4, not_applicable: false, text_value: null, submitted_at: "2026-08-30T01:00:00Z" },
  { session_id: "s1", question_id: "q1", variant_id: "v2", rating_value: null, not_applicable: true, text_value: null, submitted_at: "2026-08-30T01:01:00Z" },
  { session_id: "s1", question_id: "q2", variant_id: null, rating_value: null, not_applicable: false, text_value: 'It said "soon", which is vague, and I wasn\'t sure when', submitted_at: "2026-08-30T01:02:00Z" }
];

const gateResponses = [
  { session_id: "s2", question_id: "q3", variant_id: "v1", gate_status: "concern", comment: "Check the date rule, it varies by class", submitted_at: "2026-08-30T02:00:00Z" }
];

let failures = 0;
function check(label, condition) {
  console.log(`${condition ? "PASS" : "FAIL"}  ${label}`);
  if (!condition) failures += 1;
}

const responsesCsv = buildToneResponsesCsv({ responses, gateResponses, sessionsById, questionsById, variantsById });
const lines = responsesCsv.split("\n");

check("responses CSV has a header plus one row per answer", lines.length === 1 + responses.length + gateResponses.length);
check("not-applicable answer records the flag and no rating", lines.some((line) => line.includes(",,yes,,,")));
check("gate answer carries its status", lines.some((line) => line.includes("concern")));
check("role is resolved from the session", lines.some((line) => line.includes("audience")) && lines.some((line) => line.includes("agency")));
check("variant label is resolved, not the raw id", lines.some((line) => line.includes("Plain")) && !responsesCsv.includes("v1,"));

// The open answer contains a comma and a double quote. If escaping is
// wrong, the row splits into the wrong number of fields.
const openLine = lines.find((line) => line.includes("What felt unclear?"));
const fieldCount = (openLine.match(/(^|,)("([^"]|"")*"|[^,]*)/g) || []).length;
check("comma and quote in open text stay inside one field", fieldCount === 10);

const variantResults = [
  {
    variant: variantsById.get("v1"),
    result: {
      contentScore: 70.8,
      evidence: { level: "Medium", warning: true },
      groupScores: [
        { key: "audience_evidence", role: "audience", active: true, weight: 60, score: 75, responseCount: 3 },
        { key: "agency_assurance", role: "agency", active: true, weight: 40, score: 65, responseCount: 2 }
      ],
      gateStatuses: [
        { key: "policy_accuracy", critical: true, status: "concern" },
        { key: "safety_risk", critical: true, status: "pass" },
        { key: "privacy_consent", critical: true, status: "pass" },
        { key: "harm_blame_stigma", critical: true, status: "pass" },
        { key: "operational_promise", critical: false, status: "pass" },
        { key: "accessibility_readability", critical: false, status: "not_covered" }
      ],
      recommendation: { status: "recommended_with_caution", reason: "Score is mixed or better, with a gate at Concern and none at Fail." }
    },
    blameFlagged: false,
    preferredCount: 2
  },
  {
    variant: variantsById.get("v2"),
    result: {
      contentScore: null,
      evidence: { level: "Low", warning: true },
      groupScores: [
        { key: "audience_evidence", role: "audience", active: true, weight: 60, score: null, responseCount: 0 },
        { key: "agency_assurance", role: "agency", active: true, weight: 40, score: null, responseCount: 0 }
      ],
      gateStatuses: [
        { key: "policy_accuracy", critical: true, status: "not_covered" },
        { key: "safety_risk", critical: true, status: "not_covered" },
        { key: "privacy_consent", critical: true, status: "not_covered" },
        { key: "harm_blame_stigma", critical: true, status: "not_covered" },
        { key: "operational_promise", critical: false, status: "not_covered" },
        { key: "accessibility_readability", critical: false, status: "not_covered" }
      ],
      recommendation: { status: "insufficient_evidence", reason: "Evidence Confidence is Low." }
    },
    blameFlagged: false,
    preferredCount: 0
  }
];

const resultsCsv = buildToneResultsCsv(variantResults, ["audience", "agency"]);
const resultLines = resultsCsv.split("\n");

check("results CSV has a header plus one row per variant", resultLines.length === 3);
check("an unscored variant leaves the score blank rather than writing 0", resultLines[2].includes(",,Low,"));
check("per-role score and response count both appear", resultLines[1].includes("75,3") && resultLines[1].includes("65,2"));
check("gate statuses are written out", resultLines[1].includes("concern") && resultLines[1].includes("not_covered"));
check("recommendation reason survives its commas", resultLines[1].includes('"Score is mixed or better, with a gate at Concern and none at Fail."'));

console.log("");
console.log(failures > 0 ? `${failures} check(s) failed.` : "All checks passed.");
process.exit(failures > 0 ? 1 : 0);
