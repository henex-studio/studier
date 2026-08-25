// Publish readiness checks for a Tone Test. Mirrors the checklist in
// DEV-PLAN.md Milestone 2 Step 7, and follows the same "list every reason,
// do not stop at the first one" pattern already used for Tree Test in
// StudyListPage.jsx's getPublishIssues.

import { ROLE_KEYS } from "./defaultQuestions";
import { weightTotal } from "./weights";

const MIN_VARIANTS = 2;
const MAX_VARIANTS = 4;

function hasTextListValue(values) {
  return Array.isArray(values) && values.some((value) => String(value || "").trim());
}

function isPastExpiry(value) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() <= Date.now();
}

// study: the studies row. settings: the tone_test_settings row. variants:
// tone_variants rows. questions: tone_questions rows.
export function getTonePublishIssues(study, settings, variants, questions) {
  const issues = [];

  if (!String(study?.title || "").trim()) issues.push("Add a test title.");
  if (!hasTextListValue(study?.welcome_text)) issues.push("Add a welcome message.");
  if (!hasTextListValue(study?.privacy_text)) issues.push("Add a privacy message.");
  if (isPastExpiry(study?.expires_at)) issues.push("Set the closing time to a future New Zealand time, or clear it before publishing.");

  if (!String(settings?.scenario || "").trim()) issues.push("Add a scenario.");
  if (!String(settings?.content_goal || "").trim()) issues.push("Add a content goal.");

  const variantList = variants || [];
  if (variantList.length < MIN_VARIANTS || variantList.length > MAX_VARIANTS) {
    issues.push(`Add between ${MIN_VARIANTS} and ${MAX_VARIANTS} wording variants (currently ${variantList.length}).`);
  }
  variantList.forEach((variant, index) => {
    if (!String(variant.variant_text || "").trim()) issues.push(`Variant ${index + 1} needs wording.`);
  });

  const activeRoles = settings?.active_roles_json || {};
  const activeRoleKeys = ROLE_KEYS.filter((roleKey) => activeRoles[roleKey] !== false);
  if (activeRoleKeys.length === 0) issues.push("At least one role must be active.");

  const questionList = questions || [];
  activeRoleKeys.forEach((roleKey) => {
    const missing = questionList.some(
      (question) => question.role_key === roleKey && question.required && !String(question.question_text || "").trim()
    );
    if (missing) issues.push(`${roleKey.charAt(0).toUpperCase()}${roleKey.slice(1)} has a required question with no wording.`);
  });

  const weights = settings?.content_score_weights_json || {};
  const total = weightTotal(weights, activeRoles);
  if (activeRoleKeys.length > 0 && total !== 100) {
    issues.push(`Content Score weights for active roles must total exactly 100 (currently ${total}).`);
  }

  return issues;
}
