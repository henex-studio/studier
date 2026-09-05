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
  const [copiedRole, setCopiedRole] = useState("");
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
      setActiveRoleKeys(ROLE_KEYS.filter((roleKey) => activeRoles[roleKey] !== false));
    }

    load();
    return () => { active = false; };
  }, [study.id]);

  async function copyRoleLink(roleKey) {
    const fullLink = `${window.location.origin}/test/${study.slug}?role=${roleKey}`;
    setFallbackLink("");

    try {
      await navigator.clipboard.writeText(fullLink);
      setCopiedRole(roleKey);
      window.setTimeout(() => {
        setCopiedRole((current) => (current === roleKey ? "" : current));
      }, 2200);
    } catch {
      setCopiedRole(roleKey);
      setFallbackLink(fullLink);
    }
  }

  if (!activeRoleKeys) return null;

  if (activeRoleKeys.length === 0) {
    return <p className="muted-text">This test has no active roles to send a link for yet.</p>;
  }

  return (
    <div className="tone-role-links">
      {activeRoleKeys.map((roleKey) => (
        <div key={roleKey} className="tone-role-link-row">
          <button
            type="button"
            className="secondary-button"
            onClick={() => copyRoleLink(roleKey)}
          >
            Copy {ROLE_LABELS[roleKey]} link
          </button>
          {copiedRole === roleKey ? (
            <span className="copy-toast">
              {fallbackLink ? `Copy did not work. Link: ${fallbackLink}` : "Link copied"}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
