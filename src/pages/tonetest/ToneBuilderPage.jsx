import React, { useEffect, useState } from "react";
import AdminShell from "../../components/AdminShell";
import { supabase } from "../../lib/supabase";
import { buildDefaultQuestions, ROLE_KEYS, ROLE_LABELS, ROLE_DESCRIPTIONS, GATES } from "../../lib/tonetest/defaultQuestions";
import { WEIGHT_GROUPS, defaultWeights, weightTotal, normalizeWeights } from "../../lib/tonetest/weights";

function navigateTo(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

const NZ_TIME_ZONE = "Pacific/Auckland";

function toDateTimeLocalValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-NZ", {
    timeZone: NZ_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function dateTimeLocalToIso(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function TextListEditor({ label, helpText, values, onChange }) {
  const text = (values || []).join("\n");
  return (
    <label className="form-block">
      <span className="form-label">{label}</span>
      {helpText ? <span className="muted-text">{helpText}</span> : null}
      <textarea className="textarea" value={text} onChange={(event) => onChange(event.target.value.split("\n").filter(Boolean))} />
    </label>
  );
}

function defaultActiveRoles() {
  return { audience: true, agency: true, editor: true };
}

function activeRoleCount(activeRoles) {
  return ROLE_KEYS.filter((roleKey) => activeRoles?.[roleKey]).length;
}

// Roles and their Content Score weight sit in one list, one role per card,
// because the two are a fixed one-to-one pairing (Audience carries Audience
// Evidence, Agency carries Agency Assurance, Editor carries Content
// Quality). Showing them apart, as two separate sections, made it easy to
// lose track of which weight belonged to which role. A role's weight field
// only appears while that role is active, matching the rule that an
// inactive role's weight does not count toward the total.
function RoleAndWeightPanel({ activeRoles, weights, onRequestToggle, onUpdateWeight }) {
  const total = weightTotal(weights, activeRoles);
  const activeCount = activeRoleCount(activeRoles);

  return (
    <div>
      {activeCount === 0 ? (
        <p className="error-box">At least one role must be active before this test can be published.</p>
      ) : null}

      {ROLE_KEYS.map((roleKey) => {
        const isActive = activeRoles?.[roleKey] !== false;
        const gatesForRole = GATES.filter((gate) => gate.role === roleKey);
        const weightGroup = WEIGHT_GROUPS.find((group) => group.role === roleKey);

        return (
          <div className="question-card" key={roleKey}>
            <div className="button-row" style={{ justifyContent: "space-between" }}>
              <div>
                <p className="form-label">{ROLE_LABELS[roleKey]}</p>
                <p className="muted-text">{ROLE_DESCRIPTIONS[roleKey]}</p>
              </div>
              <label className="button-row" style={{ gap: "8px" }}>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => onRequestToggle(roleKey, gatesForRole)}
                />
                <span>{isActive ? "Active" : "Disabled"}</span>
              </label>
            </div>

            {gatesForRole.length > 0 ? (
              <p className="muted-text">
                Answers {gatesForRole.length === 1 ? "this gate" : "these gates"}: {gatesForRole.map((gate) => `${gate.label}${gate.critical ? " (critical)" : ""}`).join(", ")}
              </p>
            ) : (
              <p className="muted-text">Answers no risk gates. Supplies evidence, not judgement.</p>
            )}

            {isActive && weightGroup ? (
              <label className="form-block">
                <span className="form-label">{weightGroup.label} weight</span>
                <span className="muted-text">How much this role's ratings count toward the Content Score.</span>
                <input
                  className="text-input"
                  type="number"
                  min="0"
                  max="100"
                  value={weights?.[weightGroup.key] ?? ""}
                  onChange={(event) => onUpdateWeight(weightGroup.key, event.target.value)}
                />
              </label>
            ) : (
              <p className="muted-text">Disabled roles carry no weight. Turn this role on to set its weight.</p>
            )}
          </div>
        );
      })}

      {activeCount > 0 ? (
        <p className={total === 100 ? "success-box" : "error-box"}>
          Content Score weight total: {total}{total === 100 ? "" : " (must total exactly 100)"}
        </p>
      ) : null}
    </div>
  );
}

// Read-only. Which of the six gates exist, which role answers each, and
// whether that is critical are fixed platform facts (HANDOVER.md section
// 2.5), not settings a creator can change here. "Covered" only reflects
// whether the role currently assigned to a gate is active for this study,
// so a critical gate with no respondent is visible before it becomes a
// surprise at scoring time.
function GateOverview({ activeRoles }) {
  return (
    <div className="desktop-table test-list-table-wrap">
      <table className="test-list-table">
        <thead>
          <tr>
            <th>Gate</th>
            <th>Role</th>
            <th>Critical</th>
            <th>Coverage</th>
          </tr>
        </thead>
        <tbody>
          {GATES.map((gate) => {
            const roleActive = activeRoles?.[gate.role] !== false;
            return (
              <tr key={gate.key}>
                <td>{gate.label}</td>
                <td>{ROLE_LABELS[gate.role]}</td>
                <td>{gate.critical ? "Critical" : "Not critical"}</td>
                <td className={roleActive ? "success-box" : "error-box"}>
                  {roleActive ? "Covered" : "Not covered"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const QUESTION_TYPE_LABELS = {
  rating: "Rating questions",
  gate: "Risk gate questions",
  open: "Open questions"
};

function QuestionTemplateEditor({ questions, activeRoles, onUpdate }) {
  const activeRoleKeys = ROLE_KEYS.filter((roleKey) => activeRoles?.[roleKey] !== false);

  if (activeRoleKeys.length === 0) {
    return <p className="muted-text">No roles are active. Turn on at least one role above to see its questions.</p>;
  }

  return (
    <div>
      {activeRoleKeys.map((roleKey) => {
        const roleQuestions = questions.filter((question) => question.role_key === roleKey);

        return (
          <div key={roleKey}>
            <h3>{ROLE_LABELS[roleKey]}</h3>

            {["rating", "gate", "open"].map((questionType) => {
              const rows = roleQuestions.filter((question) => question.question_type === questionType);
              if (rows.length === 0) return null;

              return (
                <div className="form-block" key={questionType}>
                  <span className="form-label">{QUESTION_TYPE_LABELS[questionType]}</span>
                  {rows.map((question) => (
                    <div key={question.id} style={{ marginBottom: "8px" }}>
                      {question.question_type === "gate" ? (
                        <span className="muted-text">
                          {GATES.find((gate) => gate.key === question.gate_key)?.label}
                          {question.gate_critical ? " (critical)" : ""}
                        </span>
                      ) : null}
                      <textarea
                        className="textarea"
                        value={question.question_text}
                        onChange={(event) => onUpdate(question.id, event.target.value)}
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

const VARIANT_MODES = [
  { key: "single_random", label: "Single variant, randomly assigned", helpText: "Each participant sees only one variant, assigned at random." },
  { key: "compare_all", label: "Compare all variants", helpText: "Each participant sees every variant, in a randomised order, and answers a final preference question." }
];

const MIN_VARIANTS = 2;
const MAX_VARIANTS = 4;

function makeTempKey() {
  return `new-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

function VariantEditor({ variants, onUpdate, onRemove, onMove, onAdd }) {
  return (
    <div>
      {variants.length < MIN_VARIANTS ? (
        <p className="error-box">Add at least {MIN_VARIANTS} variants before this test can be published.</p>
      ) : null}

      {variants.map((variant, index) => (
        <div className="question-card" key={variant.key}>
          <div className="button-row" style={{ justifyContent: "space-between" }}>
            <p className="form-label">Variant {index + 1}</p>
            <div className="button-row">
              <button
                className="secondary-button"
                type="button"
                disabled={index === 0}
                onClick={() => onMove(variant.key, -1)}
              >
                Move up
              </button>
              <button
                className="secondary-button"
                type="button"
                disabled={index === variants.length - 1}
                onClick={() => onMove(variant.key, 1)}
              >
                Move down
              </button>
              <button
                className="danger-button"
                type="button"
                disabled={variants.length <= MIN_VARIANTS}
                onClick={() => onRemove(variant.key)}
              >
                Remove
              </button>
            </div>
          </div>

          <label className="form-block">
            <span className="form-label">Label</span>
            <span className="muted-text">A short name to tell this version apart from the others. Not shown to participants.</span>
            <input
              className="text-input"
              value={variant.label}
              onChange={(event) => onUpdate(variant.key, "label", event.target.value)}
            />
          </label>

          <label className="form-block">
            <span className="form-label">Wording</span>
            <span className="muted-text">The actual text participants will read.</span>
            <textarea
              className="textarea"
              value={variant.variant_text}
              onChange={(event) => onUpdate(variant.key, "variant_text", event.target.value)}
            />
          </label>

          <label className="form-block">
            <span className="form-label">Internal note (optional)</span>
            <span className="muted-text">For your own reference. Participants never see this.</span>
            <textarea
              className="textarea"
              value={variant.internal_note || ""}
              onChange={(event) => onUpdate(variant.key, "internal_note", event.target.value)}
            />
          </label>
        </div>
      ))}

      <button className="secondary-button" type="button" disabled={variants.length >= MAX_VARIANTS} onClick={onAdd}>
        Add variant
      </button>
      {variants.length >= MAX_VARIANTS ? <p className="muted-text">Maximum of {MAX_VARIANTS} variants.</p> : null}
    </div>
  );
}

// Shows what a participant would see after picking a given active role.
// Read-only, submits nothing. Which variants appear follows the variant
// mode exactly as section 13.3 of the PRD defines it: one assigned variant
// in single_random mode, every variant in compare_all mode. Preview always
// shows variants in their stored order; the live participant flow
// randomises order in compare_all mode and assignment in single_random
// mode, which a static preview cannot usefully reproduce, so the note below
// the variant list says as much rather than pretending to.
function RolePreview({ activeRoles, variantMode, variants, questions }) {
  const activeRoleKeys = ROLE_KEYS.filter((roleKey) => activeRoles?.[roleKey] !== false);
  const [previewRole, setPreviewRole] = useState(activeRoleKeys[0] || null);
  const currentRole = activeRoleKeys.includes(previewRole) ? previewRole : activeRoleKeys[0];

  if (activeRoleKeys.length === 0) {
    return <p className="muted-text">No roles are active. Turn on at least one role above to preview.</p>;
  }

  const modeInfo = VARIANT_MODES.find((mode) => mode.key === variantMode) || VARIANT_MODES[0];
  const shownVariants = variantMode === "compare_all" ? variants : variants.slice(0, 1);
  const roleQuestions = questions.filter((question) => question.role_key === currentRole);

  return (
    <div>
      <div className="button-row" style={{ flexWrap: "wrap" }}>
        {activeRoleKeys.map((roleKey) => (
          <button
            key={roleKey}
            type="button"
            className={roleKey === currentRole ? "primary-button" : "secondary-button"}
            onClick={() => setPreviewRole(roleKey)}
          >
            {ROLE_LABELS[roleKey]}
          </button>
        ))}
      </div>

      <p className="muted-text">
        Mode: {modeInfo.label}. {modeInfo.helpText} This preview shows variants in the order they
        are stored; the live test randomises {variantMode === "compare_all" ? "their display order" : "which one is assigned"} per participant.
      </p>

      <div className="question-card">
        <p className="form-label">Wording shown to {ROLE_LABELS[currentRole]}</p>
        {shownVariants.length === 0 ? (
          <p className="muted-text">No variants yet.</p>
        ) : (
          shownVariants.map((variant, index) => (
            <div key={variant.key} style={{ marginBottom: "8px" }}>
              {variantMode === "compare_all" ? <p className="muted-text">Variant {index + 1}{variant.label ? `: ${variant.label}` : ""}</p> : null}
              <p>{variant.variant_text || "(no wording entered yet)"}</p>
            </div>
          ))
        )}
      </div>

      <div className="question-card">
        <p className="form-label">Questions for {ROLE_LABELS[currentRole]}</p>
        {roleQuestions.length === 0 ? (
          <p className="muted-text">No questions found for this role.</p>
        ) : (
          ["rating", "gate", "open"].map((questionType) => {
            const rows = roleQuestions.filter((question) => question.question_type === questionType);
            if (rows.length === 0) return null;
            return (
              <div key={questionType} style={{ marginBottom: "8px" }}>
                <span className="form-label">{QUESTION_TYPE_LABELS[questionType]}</span>
                {rows.map((question) => (
                  <p key={question.id} className="muted-text">{question.question_text}</p>
                ))}
              </div>
            );
          })
        )}
        {variantMode === "compare_all" ? (
          <p className="muted-text">Plus a final preference question, asking the participant which variant they preferred.</p>
        ) : null}
      </div>
    </div>
  );
}

export default function ToneBuilderPage({ profile, studyId }) {
  const [study, setStudy] = useState(null);
  const [settings, setSettings] = useState(null);
  const [variants, setVariants] = useState([]);
  const [removedVariantIds, setRemovedVariantIds] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      const [
        { data: studyData, error: studyError },
        { data: settingsData, error: settingsError },
        { data: variantRows, error: variantError },
        { count: questionCount, error: questionCountError }
      ] = await Promise.all([
        supabase.from("studies").select("*").eq("id", studyId).single(),
        supabase.from("tone_test_settings").select("*").eq("study_id", studyId).maybeSingle(),
        supabase.from("tone_variants").select("*").eq("study_id", studyId).order("display_order"),
        supabase.from("tone_questions").select("id", { count: "exact", head: true }).eq("study_id", studyId)
      ]);

      if (!active) return;

      if (studyError) {
        setLoadError(studyError.message);
        setLoading(false);
        return;
      }

      setStudy(studyData);

      if (settingsError) {
        setLoadError(settingsError.message);
        setLoading(false);
        return;
      }

      if (settingsData) {
        setSettings(settingsData);
      } else {
        // First time this study has been opened. Create its settings row now,
        // using the same defaults the database applies, so there is always
        // exactly one settings row per Tone Test from this point on.
        const { data: created, error: createError } = await supabase
          .from("tone_test_settings")
          .insert({ study_id: studyId })
          .select()
          .single();

        if (!active) return;

        if (createError) {
          setLoadError(createError.message);
          setLoading(false);
          return;
        }

        setSettings(created);
      }

      if (variantError) {
        setLoadError(variantError.message);
        setLoading(false);
        return;
      }

      if (questionCountError) {
        setLoadError(questionCountError.message);
        setLoading(false);
        return;
      }

      // Seed this study's role questions the first time it is opened. The
      // table has a uniqueness rule covering study, role, type and order, so
      // if this somehow runs twice the second attempt fails rather than
      // silently doubling every question.
      if (!questionCount) {
        const { error: seedError } = await supabase
          .from("tone_questions")
          .insert(buildDefaultQuestions(studyId));

        if (!active) return;

        if (seedError) {
          setLoadError(seedError.message);
          setLoading(false);
          return;
        }
      }

      // Fetched after seeding, rather than in the earlier Promise.all, since
      // a brand new study has no rows until the seed insert above completes.
      const { data: questionRows, error: questionError } = await supabase
        .from("tone_questions")
        .select("*")
        .eq("study_id", studyId)
        .order("role_key")
        .order("question_type")
        .order("display_order");

      if (!active) return;

      if (questionError) {
        setLoadError(questionError.message);
        setLoading(false);
        return;
      }

      setQuestions(questionRows || []);

      const loadedVariants = (variantRows || []).map((row) => ({ ...row, key: row.id }));
      // A brand new Tone Test starts with two empty variants, since the test
      // needs at least two to ever be publishable and an empty builder gives
      // no cue that variants are required at all.
      setVariants(
        loadedVariants.length > 0
          ? loadedVariants
          : [
              { key: makeTempKey(), id: null, label: "", variant_text: "", internal_note: "", display_order: 0 },
              { key: makeTempKey(), id: null, label: "", variant_text: "", internal_note: "", display_order: 1 }
            ]
      );

      setLoading(false);
    }

    load();
    return () => { active = false; };
  }, [studyId]);

  function updateStudyField(field, value) {
    setStudy((current) => ({ ...current, [field]: value }));
  }

  function updateSettingsField(field, value) {
    setSettings((current) => ({ ...current, [field]: value }));
  }

  function updateWeight(groupKey, value) {
    const weights = settings.content_score_weights_json || defaultWeights();
    updateSettingsField("content_score_weights_json", { ...weights, [groupKey]: value });
  }

  function updateQuestionText(questionId, value) {
    setQuestions((current) => current.map((question) => (question.id === questionId ? { ...question, question_text: value } : question)));
  }

  function requestRoleToggle(roleKey, gatesForRole) {
    const activeRoles = settings.active_roles_json || defaultActiveRoles();
    const isCurrentlyActive = activeRoles[roleKey] !== false;

    if (isCurrentlyActive) {
      const criticalGates = gatesForRole.filter((gate) => gate.critical);
      const gateNote = gatesForRole.length > 0
        ? `\n\nThis role currently answers ${gatesForRole.length === 1 ? "this gate" : "these gates"}: ${gatesForRole.map((gate) => `${gate.label}${gate.critical ? " (critical)" : ""}`).join(", ")}.${criticalGates.length > 0 ? " This includes a critical gate, which normally blocks a recommendation on its own if it fails. With this role off, that check will not run at all." : ""}`
        : "\n\nThis role answers no risk gates, so turning it off does not remove any gate coverage.";

      const confirmed = window.confirm(
        `Turn off ${ROLE_LABELS[roleKey]}?${gateNote}`
      );
      if (!confirmed) return;
    }

    updateSettingsField("active_roles_json", { ...activeRoles, [roleKey]: !isCurrentlyActive });
  }

  function addVariant() {
    setVariants((current) => {
      if (current.length >= MAX_VARIANTS) return current;
      return [
        ...current,
        { key: makeTempKey(), id: null, label: "", variant_text: "", internal_note: "", display_order: current.length }
      ];
    });
  }

  function updateVariant(key, field, value) {
    setVariants((current) => current.map((variant) => (variant.key === key ? { ...variant, [field]: value } : variant)));
  }

  function removeVariant(key) {
    setVariants((current) => {
      if (current.length <= MIN_VARIANTS) return current;
      const target = current.find((variant) => variant.key === key);
      if (target?.id) setRemovedVariantIds((ids) => [...ids, target.id]);
      return current
        .filter((variant) => variant.key !== key)
        .map((variant, index) => ({ ...variant, display_order: index }));
    });
  }

  function moveVariant(key, direction) {
    setVariants((current) => {
      const index = current.findIndex((variant) => variant.key === key);
      const targetIndex = index + direction;
      if (index === -1 || targetIndex < 0 || targetIndex >= current.length) return current;

      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next.map((variant, position) => ({ ...variant, display_order: position }));
    });
  }

  async function saveAll() {
    setSaving(true);
    setMessage("Saving...");

    const { error: studyError } = await supabase
      .from("studies")
      .update({
        title: study.title,
        welcome_text: study.welcome_text,
        privacy_text: study.privacy_text,
        end_text: study.end_text?.length ? study.end_text : ["You have completed the test.", "Thank you for your feedback."],
        expires_at: study.expires_at || null,
        updated_at: new Date().toISOString()
      })
      .eq("id", studyId);

    if (studyError) {
      setSaving(false);
      setMessage(studyError.message);
      return;
    }

    const { error: settingsError } = await supabase
      .from("tone_test_settings")
      .update({
        scenario: settings.scenario,
        content_goal: settings.content_goal,
        sensitivity_level: settings.sensitivity_level,
        variant_mode: settings.variant_mode || "single_random",
        active_roles_json: settings.active_roles_json,
        content_score_weights_json: normalizeWeights(settings.content_score_weights_json || defaultWeights()),
        updated_at: new Date().toISOString()
      })
      .eq("study_id", studyId);

    if (settingsError) {
      setSaving(false);
      setMessage(settingsError.message);
      return;
    }

    if (questions.length > 0) {
      const results = await Promise.all(
        questions.map((question) =>
          supabase
            .from("tone_questions")
            .update({ question_text: question.question_text, updated_at: new Date().toISOString() })
            .eq("id", question.id)
        )
      );
      const questionUpdateError = results.find((result) => result.error)?.error;
      if (questionUpdateError) {
        setSaving(false);
        setMessage(questionUpdateError.message);
        return;
      }
    }

    if (removedVariantIds.length > 0) {
      const { error: deleteError } = await supabase.from("tone_variants").delete().in("id", removedVariantIds);
      if (deleteError) {
        setSaving(false);
        setMessage(deleteError.message);
        return;
      }
    }

    const toUpdate = variants.filter((variant) => variant.id);
    const toInsert = variants.filter((variant) => !variant.id);

    if (toUpdate.length > 0) {
      const results = await Promise.all(
        toUpdate.map((variant) =>
          supabase
            .from("tone_variants")
            .update({
              label: variant.label,
              variant_text: variant.variant_text,
              internal_note: variant.internal_note || null,
              display_order: variant.display_order,
              updated_at: new Date().toISOString()
            })
            .eq("id", variant.id)
        )
      );
      const updateError = results.find((result) => result.error)?.error;
      if (updateError) {
        setSaving(false);
        setMessage(updateError.message);
        return;
      }
    }

    if (toInsert.length > 0) {
      const { data: insertedRows, error: insertError } = await supabase
        .from("tone_variants")
        .insert(
          toInsert.map((variant) => ({
            study_id: studyId,
            label: variant.label,
            variant_text: variant.variant_text,
            internal_note: variant.internal_note || null,
            display_order: variant.display_order
          }))
        )
        .select();

      if (insertError) {
        setSaving(false);
        setMessage(insertError.message);
        return;
      }

      // Match inserted rows back to their local entries by position, since
      // both arrays were built in the same order, then adopt the real id so
      // a second save updates rather than inserts again.
      setVariants((current) => {
        let insertedIndex = 0;
        return current.map((variant) => {
          if (variant.id) return variant;
          const inserted = insertedRows[insertedIndex];
          insertedIndex += 1;
          return inserted ? { ...variant, id: inserted.id } : variant;
        });
      });
    }

    setRemovedVariantIds([]);
    setSaving(false);
    setMessage("Saved.");
  }

  if (loading) {
    return (
      <AdminShell profile={profile}>
        <section className="card">Loading...</section>
      </AdminShell>
    );
  }

  if (loadError) {
    return (
      <AdminShell profile={profile}>
        <section className="card">
          <p className="error-box">{loadError}</p>
          <button className="secondary-button" onClick={() => navigateTo("/admin")}>Back to test collection</button>
        </section>
      </AdminShell>
    );
  }

  return (
    <AdminShell profile={profile}>
      <section className="card">
        <div className="button-row" style={{ justifyContent: "space-between" }}>
          <h1>{study.title || "Tone Test"}</h1>
          <button className="secondary-button" onClick={() => navigateTo("/admin")}>Back to test collection</button>
        </div>
        <p className="muted-text">
          Tone Test helps a team decide which of two to four wordings to publish. It supports the
          decision. It does not replace policy, legal, privacy, comms or accessibility approval.
        </p>
      </section>

      <section className="card">
        <h2>Basics</h2>

        <label className="form-block">
          <span className="form-label">Test title</span>
          <input
            className="text-input"
            value={study.title || ""}
            onChange={(event) => updateStudyField("title", event.target.value)}
          />
        </label>

        <label className="form-block">
          <span className="form-label">Scenario</span>
          <span className="muted-text">The user situation this wording addresses. What is happening for the reader when they see this message.</span>
          <textarea
            className="textarea"
            value={settings.scenario || ""}
            onChange={(event) => updateSettingsField("scenario", event.target.value)}
          />
        </label>

        <label className="form-block">
          <span className="form-label">Content goal</span>
          <span className="muted-text">What the wording needs to achieve. What should a reader understand, feel, or do next.</span>
          <textarea
            className="textarea"
            value={settings.content_goal || ""}
            onChange={(event) => updateSettingsField("content_goal", event.target.value)}
          />
        </label>

        <label className="form-block">
          <span className="form-label">Sensitivity level</span>
          <span className="muted-text">Optional note for your own reference. What this affects is still being decided, so nothing in the test changes based on what you write here.</span>
          <input
            className="text-input"
            value={settings.sensitivity_level || ""}
            onChange={(event) => updateSettingsField("sensitivity_level", event.target.value)}
          />
        </label>
      </section>

      <section className="card">
        <h2>Participant-facing content</h2>
        <p className="muted-text">Shown to participants before they take part.</p>

        <TextListEditor
          label="Welcome message"
          helpText="One line per paragraph or bullet. Shown first, before privacy content."
          values={study.welcome_text}
          onChange={(value) => updateStudyField("welcome_text", value)}
        />

        <TextListEditor
          label="Privacy message"
          helpText="What participants should know before taking part. No names, contact details, case details or other personal information should ever be requested."
          values={study.privacy_text}
          onChange={(value) => updateStudyField("privacy_text", value)}
        />

        <TextListEditor
          label="End message"
          helpText="Shown after a participant submits."
          values={study.end_text}
          onChange={(value) => updateStudyField("end_text", value)}
        />
      </section>

      <section className="card">
        <h2>Closing time</h2>
        <label className="form-block">
          <span className="form-label">Closes at (New Zealand time)</span>
          <span className="muted-text">Optional. Leave blank for no automatic closing time.</span>
          <input
            className="text-input"
            type="datetime-local"
            value={toDateTimeLocalValue(study.expires_at)}
            onChange={(event) => updateStudyField("expires_at", dateTimeLocalToIso(event.target.value))}
          />
        </label>
      </section>

      <section className="card">
        <h2>Roles and Content Score weights</h2>
        <p className="muted-text">
          Turn a role off if nobody suitable is available for this test. The dashboard will mark
          any gate that role would have answered as not covered, never as passed. Each active
          role's weight decides how much its ratings count toward the Content Score; active
          weights must total exactly 100 before this test can be published.
        </p>
        <RoleAndWeightPanel
          activeRoles={settings.active_roles_json || defaultActiveRoles()}
          weights={settings.content_score_weights_json || defaultWeights()}
          onRequestToggle={requestRoleToggle}
          onUpdateWeight={updateWeight}
        />
      </section>

      <section className="card">
        <h2>Risk gates</h2>
        <p className="muted-text">
          The six risk gates are fixed by the platform and cannot be changed here. This shows which
          role answers each, which are critical, and whether that role is currently active for this
          test. A gate marked "Not covered" will show as not covered on the results dashboard,
          never as passed.
        </p>
        <GateOverview activeRoles={settings.active_roles_json || defaultActiveRoles()} />
      </section>

      <section className="card">
        <h2>Questions</h2>
        <p className="muted-text">
          Each active role's questions, seeded from the platform default. Edit wording here; adding
          or removing individual questions is not yet supported.
        </p>
        <QuestionTemplateEditor
          questions={questions}
          activeRoles={settings.active_roles_json || defaultActiveRoles()}
          onUpdate={updateQuestionText}
        />
      </section>

      <section className="card">
        <h2>Wording variants</h2>
        <p className="muted-text">Add two to four versions of the wording to test.</p>

        <label className="form-block">
          <span className="form-label">Variant mode</span>
          {VARIANT_MODES.map((mode) => (
            <label key={mode.key} className="button-row" style={{ gap: "8px", alignItems: "flex-start" }}>
              <input
                type="radio"
                name="variant_mode"
                checked={(settings.variant_mode || "single_random") === mode.key}
                onChange={() => updateSettingsField("variant_mode", mode.key)}
              />
              <span>
                <span className="form-label">{mode.label}</span>
                <br />
                <span className="muted-text">{mode.helpText}</span>
              </span>
            </label>
          ))}
        </label>

        <VariantEditor
          variants={variants}
          onUpdate={updateVariant}
          onRemove={removeVariant}
          onMove={moveVariant}
          onAdd={addVariant}
        />
      </section>

      <section className="card">
        <h2>Preview by role</h2>
        <p className="muted-text">
          Read-only. Shows what a participant would see after choosing each active role. Nothing
          here submits a response.
        </p>
        <RolePreview
          activeRoles={settings.active_roles_json || defaultActiveRoles()}
          variantMode={settings.variant_mode || "single_random"}
          variants={variants}
          questions={questions}
        />
      </section>

      <section className="card">
        <div className="button-row">
          <button className="primary-button" disabled={saving} onClick={saveAll}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
        {message ? <p className={message === "Saved." ? "success-box" : "error-box"}>{message}</p> : null}
      </section>
    </AdminShell>
  );
}
