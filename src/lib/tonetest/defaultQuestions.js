// Default question templates for a new Tone Test.
//
// These are seeded into tone_questions the first time a Tone Test is opened in
// the builder. Creators can edit the wording afterwards; the platform does not
// lock it. Wording here comes from the product specification, section 14,
// adapted to the settled role names and the settled gate assignment.
//
// Gate assignment follows HANDOVER.md section 2.5, not the older specification.
// Under the settled version the Agency answers five of six gates including all
// four critical ones, and the Editor answers one non-critical gate.

export const ROLE_KEYS = ["audience", "agency", "editor"];

export const ROLE_LABELS = {
  audience: "Audience",
  agency: "Agency",
  editor: "Editor"
};

export const ROLE_DESCRIPTIONS = {
  audience: "The people the content is for. They supply evidence about what happened to them when they read it. They answer no risk gates.",
  agency: "The organisation that owns the content and carries the accountability. They supply judgement, and hold the only veto.",
  editor: "A content professional who did not write the variants. They supply diagnosis, explaining why the wording reads as it does."
};

// The six fixed gates, with the role that answers each and whether a Fail
// blocks a recommendation. Fixed at platform level, not per study.
export const GATES = [
  { key: "policy_accuracy", label: "Policy accuracy", role: "agency", critical: true },
  { key: "safety_risk", label: "Safety risk", role: "agency", critical: true },
  { key: "privacy_consent", label: "Privacy and consent", role: "agency", critical: true },
  { key: "harm_blame_stigma", label: "Harm, blame and stigma", role: "agency", critical: true },
  { key: "operational_promise", label: "Operational promise", role: "agency", critical: false },
  { key: "accessibility_readability", label: "Accessibility and readability", role: "editor", critical: false }
];

const GATE_QUESTION_TEXT = {
  policy_accuracy: "Is this wording accurate against current policy and the service position?",
  safety_risk: "Could this wording create a safety risk for the reader or for anyone else?",
  privacy_consent: "Does this wording handle privacy and consent correctly?",
  harm_blame_stigma: "Could this wording cause harm, or make a reader feel blamed or stigmatised?",
  operational_promise: "Does this wording promise anything the organisation cannot deliver?",
  accessibility_readability: "Is this wording readable and usable for people with different literacy, cognitive, device and accessibility needs? This reviews the copy itself. It is not a compliance assessment against the accessibility standard, which is checked separately against the published page."
};

const RATING_QUESTIONS = {
  audience: [
    "This message is clear.",
    "I understand what I can do next.",
    "This message feels respectful.",
    "This message feels supportive.",
    "I trust this information.",
    "This message does not make me feel blamed."
  ],
  agency: [
    "This message is accurate.",
    "This message is suitable for publication review.",
    "This message aligns with current policy or service position.",
    "This message does not promise more than the organisation can deliver.",
    "This message supports the intended content goal."
  ],
  editor: [
    "This message uses plain language.",
    "The message is easy to scan.",
    "The message avoids unnecessary jargon.",
    "The message is structured in a helpful order.",
    "The message is suitable for users with different literacy, cognitive, device, or accessibility needs."
  ]
};

const OPEN_QUESTIONS = {
  audience: [
    "What do you think this message is asking you to do?",
    "What words or phrases felt helpful?",
    "What words or phrases felt unclear or uncomfortable?",
    "What would you do next after reading this?"
  ],
  agency: [
    "What policy, operational, or publication concerns do you see?",
    "What wording must change before this could be used?",
    "What evidence or reference supports your view?"
  ],
  editor: [
    "What words, phrases, or structure may make this harder to understand?",
    "What accessibility or readability concerns do you see?",
    "What wording changes would make this clearer or easier to act on?"
  ]
};

// Builds every question row for a new Tone Test, ready to insert.
export function buildDefaultQuestions(studyId) {
  const rows = [];

  ROLE_KEYS.forEach((roleKey) => {
    RATING_QUESTIONS[roleKey].forEach((text, index) => {
      rows.push({
        study_id: studyId,
        role_key: roleKey,
        question_type: "rating",
        question_text: text,
        gate_key: null,
        gate_critical: false,
        required: true,
        display_order: index
      });
    });

    GATES.filter((gate) => gate.role === roleKey).forEach((gate, index) => {
      rows.push({
        study_id: studyId,
        role_key: roleKey,
        question_type: "gate",
        question_text: GATE_QUESTION_TEXT[gate.key],
        gate_key: gate.key,
        gate_critical: gate.critical,
        required: true,
        display_order: index
      });
    });

    OPEN_QUESTIONS[roleKey].forEach((text, index) => {
      rows.push({
        study_id: studyId,
        role_key: roleKey,
        question_type: "open",
        question_text: text,
        gate_key: null,
        gate_critical: false,
        // Open questions are where the most useful signal comes from, but a
        // participant who has nothing to say should not be forced to invent
        // something, so these are not required.
        required: false,
        display_order: index
      });
    });
  });

  return rows;
}
