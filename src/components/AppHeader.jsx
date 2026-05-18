import React from "react";
import { supabase } from "../lib/supabase";

const APP_VERSION = "v3.07";

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
    navigateTo("/guide#version-history");
    window.setTimeout(() => {
      document.getElementById("version-history")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
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
          <span className="app-user-name" title={profile?.email || displayName}>
            {displayName}
          </span>

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
