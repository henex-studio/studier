// Milestone 4 Step 6. Reproduces the worked example from HANDOVER.md
// section 2.5 through the real scoring module, not a reimplementation of
// it, so a wrong result here means the library is wrong, not that a
// hand-copied second version disagrees with the first.
//
// Run with: node scripts/verify-scoring.mjs

import { computeGroupScore, computeContentScore, computeEvidenceConfidence, normalizeRatingMean } from "../src/lib/tonetest/scoring.js";

let failures = 0;

function check(label, actual, expected, tolerance = 0.05) {
  const pass = Math.abs(actual - expected) <= tolerance;
  console.log(`${pass ? "PASS" : "FAIL"}  ${label}: got ${actual}, expected ${expected}`);
  if (!pass) failures += 1;
}

// "34 Audience ratings summing to 131 give a mean of 3.853 and a group
// score of 71.3. Ten Agency ratings summing to 37 give 3.7 and 67.5. With
// Content Quality absent, the weights become 53.33 and 46.67, and the
// Content Score is 69.5."
const audienceMean = 131 / 34;
const agencyMean = 37 / 10;

check("Audience mean", audienceMean, 3.853, 0.001);
check("Agency mean", agencyMean, 3.7, 0.001);

const audienceScore = normalizeRatingMean(audienceMean);
const agencyScore = normalizeRatingMean(agencyMean);

check("Audience group score", audienceScore, 71.3);
check("Agency group score", agencyScore, 67.5);

// computeGroupScore should reproduce the same number starting from raw
// values, not just from an already-known mean.
const audienceRatings = Array(34).fill(0).map((_, index) => (index < 131 % 34 ? Math.ceil(131 / 34) : Math.floor(131 / 34)));
// The exact distribution of individual ratings is not given in the worked
// example, only the sum and count, and the mean depends only on those two
// numbers. Any 34 integers 1 to 5 summing to 131 must produce the same
// mean, so a synthetic set that sums correctly is a valid check of
// computeGroupScore's arithmetic, not of the specific (unknown) responses.
const sum = audienceRatings.reduce((a, b) => a + b, 0);
check("Synthetic Audience ratings sum to 131", sum, 131, 0);
check("computeGroupScore(audience ratings)", computeGroupScore(audienceRatings), 71.3);

const contentScore = computeContentScore([
  { key: "audience_evidence", weight: 40, score: audienceScore },
  { key: "agency_assurance", weight: 35, score: agencyScore },
  { key: "content_quality", weight: 25, score: null }
]);

check("Content Score with Content Quality absent", contentScore, 69.5);

// Evidence Confidence: sanity checks on the stated thresholds, not from
// the worked example (which does not exercise Evidence Confidence), but
// from HANDOVER.md section 2.5's own statement of the boundaries.
const highCase = computeEvidenceConfidence([{ role: "audience", count: 5 }, { role: "agency", count: 5 }]);
if (highCase.level !== "High") { console.log(`FAIL  Evidence High case: got ${highCase.level}`); failures += 1; }
else console.log("PASS  Evidence High case: 5 and 5, imbalance 1.0, gives High");

const downgradedCase = computeEvidenceConfidence([{ role: "audience", count: 5 }, { role: "agency", count: 2 }]);
if (downgradedCase.level !== "Medium") { console.log(`FAIL  Evidence downgrade case: got ${downgradedCase.level}`); failures += 1; }
else console.log("PASS  Evidence downgrade case: 5 and 2, imbalance 0.4, High downgraded to Medium");

const lowCase = computeEvidenceConfidence([{ role: "audience", count: 1 }, { role: "agency", count: 0 }]);
if (lowCase.level !== "Low") { console.log(`FAIL  Evidence Low case: got ${lowCase.level}`); failures += 1; }
else console.log("PASS  Evidence Low case: 1 and 0, gives Low");

console.log("");
if (failures > 0) {
  console.log(`${failures} check(s) failed.`);
  process.exit(1);
} else {
  console.log("All checks passed.");
}
