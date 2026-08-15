import React, { useEffect, useState } from "react";
import AdminShell from "../../components/AdminShell";
import { supabase } from "../../lib/supabase";

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

export default function ToneBuilderPage({ profile, studyId }) {
  const [study, setStudy] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      const [{ data: studyData, error: studyError }, { data: settingsData, error: settingsError }] = await Promise.all([
        supabase.from("studies").select("*").eq("id", studyId).single(),
        supabase.from("tone_test_settings").select("*").eq("study_id", studyId).maybeSingle()
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
        updated_at: new Date().toISOString()
      })
      .eq("study_id", studyId);

    setSaving(false);

    if (settingsError) {
      setMessage(settingsError.message);
      return;
    }

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
          <button className="secondary-button" onClick={() => navigateTo("/")}>Back to test collection</button>
        </section>
      </AdminShell>
    );
  }

  return (
    <AdminShell profile={profile}>
      <section className="card">
        <div className="button-row" style={{ justifyContent: "space-between" }}>
          <h1>{study.title || "Tone Test"}</h1>
          <button className="secondary-button" onClick={() => navigateTo("/")}>Back to test collection</button>
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
        <h2>Wording variants</h2>
        <p className="muted-text">Add two to four versions of the wording to test. Coming next.</p>
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
