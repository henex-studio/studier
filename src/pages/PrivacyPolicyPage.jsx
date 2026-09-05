import React from "react";
import Hero from "../components/Hero";
import PrivacyPolicyContent, { PRIVACY_POLICY_VERSION } from "./PrivacyPolicyContent";

// The full-page route at /privacy, reachable signed out. The wording
// itself lives in PrivacyPolicyContent.jsx, shared with PrivacyPolicyModal
// so the two never carry two different copies of the same document.
export { PRIVACY_POLICY_VERSION };

export default function PrivacyPolicyPage() {
  return (
    <div className="page-shell">
      <main className="container narrow">
        <section className="card">
          <Hero />

          <PrivacyPolicyContent />

          <p className="auth-switch-text">
            <a href="/login">Back to sign in</a>
          </p>
        </section>
      </main>
    </div>
  );
}
