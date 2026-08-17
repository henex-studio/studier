import React, { useEffect, useState } from "react";
import AdminShell from "../../components/AdminShell";
import { supabase } from "../../lib/supabase";
import { buildDefaultQuestions, ROLE_KEYS, ROLE_LABELS, ROLE_DESCRIPTIONS, GATES } from "../../lib/tonetest/defaultQuestions";

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

function RoleToggles({ activeRoles, onRequestToggle }) {
  return (
    <div>
      {activeRoleCount(activeRoles) === 0 ? (
        <p className="error-box">At least one role must be active before this test can be published.</p>
      ) : null}

      {ROLE_KEYS.map((roleKey) => {
        const isActive = activeRoles?.[roleKey] !== false;
        const gatesForRole = GATES.filter((gate) => gate.role === roleKey);

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
          </div>
        );
      })}
    </div>
  );
}

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

export default function ToneBuilderPage({ profile, studyId }) {
  const [study, setStudy] = useState(null);
  const [settings, setSettings] = useState(null);
  const [variants, setVariants] = useState([]);
  const [removedVariantIds, setRemovedVariantIds] = useState([]);
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
        active_roles_json: settings.active_roles_json,
        updated_at: new Date().toISOString()
      })
      .eq("study_id", studyId);

    if (settingsError) {
      setSaving(false);
      setMessage(settingsError.message);
      return;
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
        <h2>Roles</h2>
        <p className="muted-text">
          Turn a role off if nobody suitable is available for this test. The dashboard will mark
          any gate that role would have answered as not covered, never as passed.
        </p>
        <RoleToggles
          activeRoles={settings.active_roles_json || defaultActiveRoles()}
          onRequestToggle={requestRoleToggle}
        />
      </section>

      <section className="card">
        <h2>Wording variants</h2>
        <p className="muted-text">Add two to four versions of the wording to test.</p>
        <VariantEditor
          variants={variants}
          onUpdate={updateVariant}
          onRemove={removeVariant}
          onMove={moveVariant}
          onAdd={addVariant}
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
