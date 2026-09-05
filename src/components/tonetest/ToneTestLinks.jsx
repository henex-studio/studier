import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { ROLE_KEYS, ROLE_LABELS } from "../../lib/tonetest/defaultQuestions";

// Replaces the single "Copy link" button that a tree test uses, for a
// published tone test. A tone test link now carries ?role=<key>, so the
// person who opens it lands straight on their own role's questions with no
// "choose your role" screen to get wrong (see ToneTestRunnerPage.jsx and
// the role-links decision recorded 5 September 2026). This component owns
// that behaviour so StudyListPage.jsx only needs a one-line dispatch to it,
// per CLAUDE.md section 3: shared pages route into a tonetest module,
// they do not do the module's work themselves.
//
// The bare link (no role parameter) still works and still shows the
// original self-select screen, so nothing that already has that link
// breaks.
export default function ToneTestLinks({ study }) {
  const [activeRoleKeys, setActiveRoleKeys] = useState(null);
  const [chosenRole, setChosenRole] = useState("");
  const [copied, setCopied] = useState(false);
  const [fallbackLink, setFallbackLink] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      const { data } = await supabase
        .from("tone_test_settings")
        .select("active_roles_json")
        .eq("study_id", study.id)
        .maybeSingle();

      if (!active) return;

      const activeRoles = data?.active_roles_json || {};
      const keys = ROLE_KEYS.filter((roleKey) => activeRoles[roleKey] !== false);
      setActiveRoleKeys(keys);
      setChosenRole(keys[0] || "");
    }

    load();
    return () => { active = false; };
  }, [study.id]);

  async function copyRoleLink() {
    if (!chosenRole) return;
    const fullLink = `${window.location.origin}/test/${study.slug}?role=${chosenRole}`;
    setFallbackLink("");

    try {
      await navigator.clipboard.writeText(fullLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(true);
      setFallbackLink(fullLink);
    }
  }

  if (!activeRoleKeys) return null;

  if (activeRoleKeys.length === 0) {
    return <p className="muted-text">This test has no active roles to send a link for yet.</p>;
  }

  // One row: pick the role, copy that role's link. Three separate copy
  // buttons was the first version and made the study card much taller
  // than a tree test's, which unbalanced the collection page.
  return (
    <div className="tone-role-links">
      <div className="tone-role-link-row">
        <select
          className="text-input tone-role-select"
          value={chosenRole}
          onChange={(event) => { setChosenRole(event.target.value); setCopied(false); }}
          aria-label="Which role's link to copy"
        >
          {activeRoleKeys.map((roleKey) => (
            <option key={roleKey} value={roleKey}>{ROLE_LABELS[roleKey]}</option>
          ))}
        </select>
        <button type="button" className="secondary-button" onClick={copyRoleLink}>Copy link</button>
      </div>

      {copied ? (
        <span className="copy-toast">
          {fallbackLink ? `Copy did not work. Link: ${fallbackLink}` : "Link copied"}
        </span>
      ) : null}
    </div>
  );
}
