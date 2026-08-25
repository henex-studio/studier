// Content Score weight groups and the arithmetic around them. Moved out of
// ToneBuilderPage.jsx so the same rule (a role's weight only counts while
// that role is active, and active weights must total exactly 100) can be
// reused by the publish checks in publishChecks.js without duplicating it.

export const WEIGHT_GROUPS = [
  { key: "audience_evidence", label: "Audience Evidence", role: "audience" },
  { key: "agency_assurance", label: "Agency Assurance", role: "agency" },
  { key: "content_quality", label: "Content Quality", role: "editor" }
];

export function defaultWeights() {
  return { audience_evidence: 40, agency_assurance: 35, content_quality: 25 };
}

// Only the weights belonging to currently active roles count toward the
// total. A role that is off contributes nothing, so its stored weight (kept,
// not cleared, so it comes back if the role is turned on again) is excluded
// here rather than forced to zero.
export function weightTotal(weights, activeRoles) {
  return WEIGHT_GROUPS
    .filter((group) => activeRoles?.[group.role] !== false)
    .reduce((sum, group) => sum + (Number(weights?.[group.key]) || 0), 0);
}

// Coerces every weight to a real number before it is written to the
// database. The builder allows a field to sit empty while the operator is
// typing a new value; nothing empty should ever reach the database.
export function normalizeWeights(weights) {
  return WEIGHT_GROUPS.reduce((normalized, group) => {
    normalized[group.key] = Number(weights?.[group.key]) || 0;
    return normalized;
  }, {});
}
