import React from "react";
import { supabase } from "../lib/supabase";

const APP_VERSION = "v4.04";

function navigateTo(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function AppHeader({ profile }) {
  async function signOut() {
    await supabase.auth.signOut();
    navigateTo("/login");
  }

  function openVersionHistory() {
    navigateTo("/version-history");
  }

  const displayName = profile?.display_name || profile?.email || "User";

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-brand">
          <button
            className="app-wordmark"
            type="button"
            onClick={() => navigateTo("/admin")}
            aria-label="Go to test collection"
          >
            Studier
          </button>
          <button
            className="app-version-link"
            type="button"
            onClick={openVersionHistory}
            title="View version history"
            aria-label={`View Studier ${APP_VERSION} version history`}
          >
            {APP_VERSION}
          </button>
        </div>

        <nav className="app-nav" aria-label="Main navigation">
          <button
            className="app-user-name"
            type="button"
            onClick={() => navigateTo("/account")}
            title={`${profile?.email || displayName} — click to edit your account`}
            style={{ background: "none", border: 0, cursor: "pointer", padding: 0, font: "inherit" }}
          >
            {displayName}
          </button>

          <button
            className="app-nav-link"
            type="button"
            onClick={() => navigateTo("/admin")}
          >
            Test collection
          </button>

          <button
            className="app-nav-link"
            type="button"
            onClick={() => navigateTo("/guide")}
          >
            Guide
          </button>

          <button
            className="app-nav-link"
            type="button"
            onClick={signOut}
          >
            Sign out
          </button>
        </nav>
      </div>
    </header>
  );
}
