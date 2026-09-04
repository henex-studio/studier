// Milestone 4 Step 1. Pure calculation, no screen and no database access, so
// every number here can be checked in isolation from how it is displayed.
//
// Every rule is taken from HANDOVER.md section 2.5, the authority on
// scoring (see the header note added to harness-docs/open-questions.md on
// 30 August 2026). Two places required a judgment call beyond what section
// 2.5 states word for word; both are marked below with why.

import { GATES } from "./defaultQuestions.js";
import { WEIGHT_GROUPS } from "./weights.js";

export const CONTENT_SCORE_BANDS = { strong: 70, mixed: 50 };

export const EVIDENCE_HIGH_MIN_PER_GROUP = 5;
export const EVIDENCE_MEDIUM_MIN_PER_GROUP = 3;
export const EVIDENCE_HIGH_IMBALANCE_MIN = 0.5;
export const EVIDENCE_MEDIUM_IMBALANCE_MIN = 0.2;
export const EVIDENCE_WARNING_MIN_PER_GROUP = 3;

export const DEFAULT_BLAME_FLAG_THRESHOLD = 3.5;
export const BLAME_GATE_KEY = "harm_blame_stigma";

// Rating questions have no stable key the way gate questions have
// gate_key; only question_text, which the creator can edit (Milestone 2
// Step 3), and display_order, which the creator cannot change since the
// builder does not yet support reordering, adding, or removing individual
// questions. The blame question is seeded as the sixth (index 5) Audience
// rating question in defaultQuestions.js, so that position is used to find
// it rather than matching on wording, which would silently stop working
// the moment a creator rephrases it. If reordering is ever added to the
// builder, this breaks and needs a real identifier instead.
export const BLAME_QUESTION_ROLE = "audience";
export const BLAME_QUESTION_DISPLAY_ORDER = 5;

// ---------------------------------------------------------------------
// Content Score
// ---------------------------------------------------------------------

// (mean − 1) ÷ 4 × 100, mapping a 1 to 5 mean onto 0 to 100.
export function normalizeRatingMean(mean) {
  return ((mean - 1) / 4) * 100;
}

// ratingValues: numbers 1 to 5 only. A caller must already have removed
// nulls and "not applicable" answers before this point; this function has
// no way to tell the difference between "no data" and "excluded data",
// which is exactly why that filtering has to happen earlier, not here.
export function computeGroupScore(ratingValues) {
  if (!ratingValues || ratingValues.length === 0) return null;
  const mean = ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length;
  return normalizeRatingMean(mean);
}

// groupInputs: one entry per WEIGHT_GROUPS entry, [{ key, weight, score }],
// score is null when that group had no ratings for this variant. A group
// with no responses has its weight removed and the rest scale up
// proportionally to total 100, never treated as zero score. Verified
// against the worked example in section 2.5: Audience weight 40 score
// 71.3, Agency weight 35 score 67.5, Content Quality absent, gives 69.5.
export function computeContentScore(groupInputs) {
  const included = (groupInputs || []).filter((group) => group.score !== null && group.weight > 0);
  if (included.length === 0) return null;

  const weightSum = included.reduce((sum, group) => sum + group.weight, 0);
  if (weightSum <= 0) return null;

  const score = included.reduce((sum, group) => sum + (group.weight / weightSum) * group.score, 0);
  return Math.round(score * 10) / 10;
}

// ---------------------------------------------------------------------
// Evidence Confidence
// ---------------------------------------------------------------------

// roleGroupCounts: [{ role, count }], one entry per currently active role,
// count is the number of distinct participants who answered as that role
// for this variant with at least one real (non "not applicable") rating.
//
// Judgment call: section 2.5 says "non-null responses per active role
// group", which does not by itself say whether a "response" is a single
// rating answer or a participant. Counting individual rating answers was
// rejected: Audience has six rating questions, Agency five, Editor five,
// so a participant count of Audience 5 versus Agency 5 would read very
// differently if measured in rating rows, since one Audience participant
// contributes up to six rows to Agency's five. The imbalance ratio only
// means "did we hear from roles in reasonable proportion" if the unit
// being compared is people, not answer fields, so this counts sessions.
export function computeEvidenceConfidence(roleGroupCounts) {
  const counts = (roleGroupCounts || []).map((group) => group.count || 0);

  if (counts.length === 0) {
    return { level: "Low", imbalanceRatio: null, warning: false };
  }

  const max = Math.max(...counts);
  const min = Math.min(...counts);
  const imbalanceRatio = max > 0 ? min / max : 0;
  const warning = counts.some((count) => count < EVIDENCE_WARNING_MIN_PER_GROUP);

  const allAtLeastHigh = counts.every((count) => count >= EVIDENCE_HIGH_MIN_PER_GROUP);
  const anyAtLeastMedium = counts.some((count) => count >= EVIDENCE_MEDIUM_MIN_PER_GROUP);

  let level;
  if (allAtLeastHigh) {
    level = imbalanceRatio >= EVIDENCE_HIGH_IMBALANCE_MIN ? "High" : "Medium";
  } else if (anyAtLeastMedium) {
    level = imbalanceRatio >= EVIDENCE_MEDIUM_IMBALANCE_MIN ? "Medium" : "Low";
  } else {
    level = "Low";
  }

  return { level, imbalanceRatio, warning };
}

// ---------------------------------------------------------------------
// Risk gates
// ---------------------------------------------------------------------

// gateResponsesByKey: { [gate_key]: [{ gate_status }] } for one variant.
// activeRoles: the study's active_roles_json.
//
// Judgment call: HANDOVER.md does not state how two answers to the same
// gate for the same variant combine, since a study could in principle have
// more than one Agency respondent. Worst case wins, Fail over Concern over
// Pass, matching the tool's own stated design: "this tool is deliberately
// conservative" (section 2.5, the reasoning under recommendation rule 3).
export function computeGateStatuses(gateResponsesByKey, activeRoles) {
  return GATES.map((gate) => {
    const roleActive = activeRoles?.[gate.role] !== false;
    const responses = (roleActive && gateResponsesByKey?.[gate.key]) || [];

    if (!roleActive || responses.length === 0) {
      return { ...gate, status: "not_covered" };
    }

    const hasFail = responses.some((response) => response.gate_status === "fail");
    const hasConcern = responses.some((response) => response.gate_status === "concern");
    const status = hasFail ? "fail" : hasConcern ? "concern" : "pass";
    return { ...gate, status };
  });
}

// audienceBlameMean: the Audience group's mean rating on the blame
// question, or null if nobody answered it. Not the normalised 0-100 score;
// the threshold is stated on the original 1 to 5 scale, so comparison
// happens there.
export function computeBlameFlag(audienceBlameMean, threshold) {
  if (audienceBlameMean === null || audienceBlameMean === undefined) return false;
  const effectiveThreshold = Number(threshold) || DEFAULT_BLAME_FLAG_THRESHOLD;
  return audienceBlameMean < effectiveThreshold;
}

// ---------------------------------------------------------------------
// Recommendation status
// ---------------------------------------------------------------------

export const RECOMMENDATION_LABELS = {
  not_recommended: "Not recommended until revised",
  insufficient_evidence: "Insufficient evidence",
  recommended_for_review: "Recommended for review",
  recommended_with_caution: "Recommended with caution",
  needs_revision: "Needs revision"
};

// Rules evaluated in priority order, first match wins, per section 2.5.
//
// One rule was added beyond the five in section 2.5, and one was widened.
// Both are judgment calls, not free invention; both are recorded in
// DEV-LOG.md and DEV-PLAN.md under Milestone 4.
//
// Added: an uncovered critical gate blocks the top two statuses, settled
// by the operator on 30 August 2026. A study can disable the Agency role,
// which leaves all four critical gates with no respondent. "Not covered"
// is not "Fail", so without this rule such a study could reach the top
// status having had no risk review at all, contradicting section 2.5's own
// statement that the Agency is the role the process can least afford to
// lose.
//
// Widened: section 2.5's own rule 5 ("Needs revision") requires "no gate
// at Fail", the same as rules 3 and 4. Read literally, a non-critical gate
// Fail (for example Accessibility and readability) with a high score and
// sufficient evidence matches none of the five stated rules at all. Rule 5
// is used here as the true fallback, catching anything that a critical
// Fail, Low evidence or an uncovered critical gate has not already routed
// elsewhere. This is the minimal reading consistent with section 2.5's own
// reasoning under rule 3, that a Fail is a reviewer's judgment that a real
// problem exists and should never be silently disregarded.
export function computeRecommendationStatus({ contentScore, evidenceLevel, gateStatuses }) {
  const criticalGates = (gateStatuses || []).filter((gate) => gate.critical);
  const anyCriticalFail = criticalGates.some((gate) => gate.status === "fail");
  const anyCriticalNotCovered = criticalGates.some((gate) => gate.status === "not_covered");
  const anyGateFail = (gateStatuses || []).some((gate) => gate.status === "fail");
  const anyGateConcern = (gateStatuses || []).some((gate) => gate.status === "concern");

  if (anyCriticalFail) {
    return { status: "not_recommended", reason: "A critical risk gate is Fail." };
  }

  if (evidenceLevel === "Low") {
    return { status: "insufficient_evidence", reason: "Evidence Confidence is Low." };
  }

  if (anyCriticalNotCovered) {
    return {
      status: "needs_revision",
      reason: "A critical risk gate has no respondent, so no risk review has happened yet."
    };
  }

  if (contentScore !== null && contentScore >= CONTENT_SCORE_BANDS.strong && !anyGateFail) {
    return { status: "recommended_for_review", reason: "Score is strong, evidence is sufficient, and no gate failed." };
  }

  if (contentScore !== null && contentScore >= CONTENT_SCORE_BANDS.mixed && anyGateConcern && !anyGateFail) {
    return { status: "recommended_with_caution", reason: "Score is mixed or better, with a gate at Concern and none at Fail." };
  }

  return { status: "needs_revision", reason: "Score, evidence, or gate status is not yet strong enough for the top statuses." };
}

// ---------------------------------------------------------------------
// Top-level entry point: everything above, run for one variant.
// ---------------------------------------------------------------------

// input shape:
// {
//   activeRoles: { audience, agency, editor },
//   weights: { audience_evidence, agency_assurance, content_quality },
//   ratingsByRole: { [role]: number[] },       // real ratings only, no NA
//   participantCountsByRole: { [role]: number }, // distinct sessions, real ratings only
//   gateResponsesByKey: { [gate_key]: [{ gate_status }] },
//   blameFlagThreshold: number
// }
export function computeVariantResult(input) {
  const activeRoles = input.activeRoles || {};
  const weights = input.weights || {};

  const groupInputs = WEIGHT_GROUPS.map((group) => {
    const roleActive = activeRoles[group.role] !== false;
    const ratings = roleActive ? input.ratingsByRole?.[group.role] || [] : [];
    return {
      key: group.key,
      role: group.role,
      active: roleActive,
      weight: roleActive ? Number(weights[group.key]) || 0 : 0,
      score: computeGroupScore(ratings),
      // People, not rating rows. Same unit Evidence Confidence uses, so a
      // reader comparing the two on screen is comparing like with like.
      responseCount: roleActive ? input.participantCountsByRole?.[group.role] || 0 : 0
    };
  });

  const contentScore = computeContentScore(groupInputs);

  const roleGroupCounts = WEIGHT_GROUPS.filter((group) => activeRoles[group.role] !== false).map((group) => ({
    role: group.role,
    count: input.participantCountsByRole?.[group.role] || 0
  }));
  const evidence = computeEvidenceConfidence(roleGroupCounts);

  const gateStatuses = computeGateStatuses(input.gateResponsesByKey, activeRoles);

  const recommendation = computeRecommendationStatus({
    contentScore,
    evidenceLevel: evidence.level,
    gateStatuses
  });

  return {
    groupScores: groupInputs,
    contentScore,
    evidence,
    gateStatuses,
    recommendation
  };
}
