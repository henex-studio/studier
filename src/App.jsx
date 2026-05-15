import React, { useEffect, useMemo, useState } from "react";
import { supabase, supabaseReady } from "./lib/supabase";
import LoginPage from "./pages/LoginPage";
import StudyListPage from "./pages/StudyListPage";
import StudyBuilderPage from "./pages/StudyBuilderPage";
import TestRunnerPage from "./pages/TestRunnerPage";
import DashboardPage from "./pages/DashboardPage";

function parsePath() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  return {
    parts,
    first: parts[0] || ""
  };
}

function navigateTo(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function isPlainLeftClick(event) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  );
}

export default function App() {
  const [{ parts, first }, setRoute] = useState(parsePath());
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authChecked, setAuthChecked] = useState(!supabaseReady);
  const [profileChecked, setProfileChecked] = useState(false);

  const routeKey = useMemo(() => window.location.pathname, [parts, first]);

  useEffect(() => {
    const onPop = () => setRoute(parsePath());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    function onDocumentClick(event) {
      if (!isPlainLeftClick(event)) return;

      const link = event.target.closest?.("a[href]");
      if (!link) return;
      if (link.target && link.target !== "_self") return;
      if (link.hasAttribute("download")) return;

      const url = new URL(link.href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      event.preventDefault();
      navigateTo(`${url.pathname}${url.search}${url.hash}`);
    }

    document.addEventListener("click", onDocumentClick);
    return () => document.removeEventListener("click", onDocumentClick);
  }, []);

  useEffect(() => {
    if (!supabaseReady) return;

    let active = true;

    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session || null);
      setAuthChecked(true);
    }

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
      setProfile(null);
      setProfileChecked(false);
      setAuthChecked(true);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabaseReady || !authChecked) return;

    let active = true;

    async function loadProfile() {
      if (!session?.user) {
        setProfile(null);
        setProfileChecked(true);
        return;
      }

      setProfileChecked(false);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        setProfile({
          id: session.user.id,
          email: session.user.email,
          role: "user",
          display_name: null
        });
      } else {
        setProfile(data || {
          id: session.user.id,
          email: session.user.email,
          role: "user",
          display_name: null
        });
      }

      setProfileChecked(true);
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [authChecked, session]);

  if (!supabaseReady) {
    return (
      <main className="container narrow">
        <section className="card">
          <h1>Configuration needed</h1>
          <p>Supabase environment variables are missing.</p>
        </section>
      </main>
    );
  }

  if (first === "test" && parts[1]) {
    return <TestRunnerPage key={routeKey} slug={parts[1]} />;
  }

  const loading = !authChecked || (session?.user && !profileChecked);

  if (loading) {
    return (
      <div className="page-shell">
        <main className="container narrow">
          <section className="card">Loading...</section>
        </main>
      </div>
    );
  }

  if (!session || !profile) {
    return <LoginPage />;
  }

  if (first === "builder" && parts[1]) {
    return <StudyBuilderPage key={routeKey} profile={profile} studyId={parts[1]} />;
  }

  if (first === "dashboard" && parts[1]) {
    return <DashboardPage key={routeKey} profile={profile} studyId={parts[1]} />;
  }

  return <StudyListPage key={routeKey} profile={profile} />;
}
