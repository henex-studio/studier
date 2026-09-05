import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import Hero from "../components/Hero";
import PrivacyPolicyModal from "../components/PrivacyPolicyModal";

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
  const [privacyOpen, setPrivacyOpen] = useState(false);
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

          <Hero />

          <h1>Use Studier responsibly</h1>
          <p>
            Studier is an internal pilot tool for small scale user testing, currently supporting tree tests of menu structures and tone tests of wording. It is not a production service.
          </p>

          <div className="consent-section">
            <h2>Use conditions</h2>
            <ol>
              <li>Use Studier only for small scale internal testing and evaluation.</li>
              <li>Do not use Studier for commercial services, public research, or large scale data collection without approval.</li>
              <li>Before using Studier for a test, inform your manager, lead, or relevant approval owner and have their agreement.</li>
              <li>This does not replace any required privacy, ethics, information security, research, data governance, or business approval.</li>
              <li>Do not collect names, contact details, case details, sensitive information, or information that could identify a person.</li>
              <li>You are responsible for task wording, privacy note, checking the test, and sharing only with intended internal users.</li>
              <li>Check exported data before sharing, and remove any personal or sensitive information.</li>
              <li>If unsure, do not publish until checked with a lead, advisor, or approval owner.</li>
            </ol>
          </div>

          <div className="consent-section">
            <h2>Consent</h2>

            <p className="muted-text">
              These use conditions are about how you use Studier. What Studier collects about you,
              and about the people who answer your tests, is set out separately in the{" "}
              <button type="button" className="text-link text-link-button" onClick={() => setPrivacyOpen(true)}>
                privacy policy
              </button>.
            </p>

            <label className="consent-check-row">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span>
                I have read and agree to these use conditions, and will only use Studier with appropriate internal approval.
              </span>
            </label>
          </div>

          {message ? <p className="error-box">{message}</p> : null}

          {signedIn ? (
            <div className="button-row">
              <button
                className="primary-button"
                disabled={!agreed || saving}
                onClick={acceptForSignedInUser}
              >
                {saving ? "Saving..." : "Accept and continue"}
              </button>
            </div>
          ) : (
            <div className="button-row">
              <button
                className="primary-button"
                disabled={!agreed}
                onClick={() => acceptBeforeAuth("/login")}
              >
                Sign in
              </button>

              <button
                className="secondary-button"
                disabled={!agreed}
                onClick={() => acceptBeforeAuth("/register")}
              >
                Register
              </button>
            </div>
          )}
        </section>
      </main>

      <PrivacyPolicyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </div>
  );
}
