import React, { useState } from "react";
import { supabase } from "../lib/supabase";

export const CONSENT_VERSION = "2026-05-v2";
export const CONSENT_STORAGE_KEY = "studier_platform_consent_version";

function navigateTo(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function saveLocalConsent() {
  window.localStorage.setItem(CONSENT_STORAGE_KEY, CONSENT_VERSION);
}

export function hasLocalConsent() {
  return window.localStorage.getItem(CONSENT_STORAGE_KEY) === CONSENT_VERSION;
}

export function hasProfileConsent(profile) {
  return profile?.consent_version === CONSENT_VERSION;
}

export default function ConsentPage({ profile = null, onAccepted = null }) {
  const [agreed, setAgreed] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const signedIn = Boolean(profile?.id);

  async function acceptForSignedInUser() {
    setMessage("");
    setSaving(true);

    const { error } = await supabase.rpc("accept_platform_consent", {
      p_consent_version: CONSENT_VERSION
    });

    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    saveLocalConsent();

    if (onAccepted) {
      onAccepted({
        ...profile,
        consent_version: CONSENT_VERSION,
        consent_accepted_at: new Date().toISOString()
      });
    }

    navigateTo("/admin");
  }

  function acceptBeforeAuth(path) {
    saveLocalConsent();
    navigateTo(path);
  }

  return (
    <div className="page-shell">
      <main className="container narrow">
        <section className="card hero-card consent-card">
          <span className="badge">Studier internal pilot</span>
          <h1>Use Studier responsibly</h1>
          <p>
            Studier is an internal pilot tool for small scale testing and evaluation of menu structures. It is not a production service.
          </p>

          <div className="consent-section">
            <h2>Use conditions</h2>
            <ol>
              <li>Use Studier only for small scale internal testing and evaluation.</li>
              <li>Do not use Studier for commercial services, public research, or large scale data collection without approval.</li>
              <li>Before using Studier for a test, inform your manager, lead, or relevant approval owner and have their agreement to use this tool for that purpose.</li>
              <li>This agreement does not replace any required privacy, ethics, information security, research, data governance, or business approval process.</li>
              <li>Do not use Studier to collect names, contact details, case details, sensitive information, or information that could identify a person.</li>
              <li>You are responsible for clear task wording, an appropriate privacy note, checking the test before publishing, and sharing the test link only with the intended small internal group.</li>
              <li>Check exported data before sharing it, and remove any personal, sensitive, or identifying information.</li>
              <li>If you are unsure whether your planned use is appropriate, do not publish the test until you have checked with the relevant lead, advisor, or approval owner.</li>
            </ol>
          </div>

          <div className="consent-section">
            <h2>Consent</h2>
            <p>
              By selecting the checkbox, you confirm that you have read and agree to use Studier under these conditions.
            </p>
            <label className="consent-check-row">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
              />
              <span>
                I have read and agree to these use conditions, and I confirm that I will only use Studier with the appropriate internal agreement or approval.
              </span>
            </label>
          </div>

          {message ? <p className="error-box">{message}</p> : null}

          {signedIn ? (
            <div className="button-row">
              <button className="primary-button" disabled={!agreed || saving} onClick={acceptForSignedInUser}>
                {saving ? "Saving..." : "Accept and continue"}
              </button>
            </div>
          ) : (
            <div className="button-row">
              <button className="primary-button" disabled={!agreed} onClick={() => acceptBeforeAuth("/login")}>
                Sign in
              </button>
              <button className="secondary-button" disabled={!agreed} onClick={() => acceptBeforeAuth("/register")}>
                Register
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
