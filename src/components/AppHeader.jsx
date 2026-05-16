import React from "react";
import { supabase } from "../lib/supabase";

function navigateTo(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function AppHeader({ profile }) {
  async function signOut() {
    await supabase.auth.signOut();
    navigateTo("/login");
  }

  const displayName = profile?.display_name || profile?.email || "User";

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <button
          className="app-wordmark"
          type="button"
          onClick={() => navigateTo("/admin")}
          aria-label="Go to test collection"
        >
          Studier
        </button>

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
