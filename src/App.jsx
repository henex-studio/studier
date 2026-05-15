import React, { useEffect, useState } from "react";
import { supabase, supabaseReady } from "./lib/supabase";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import StudyListPage from "./pages/StudyListPage";
import StudyBuilderPage from "./pages/StudyBuilderPage";
import TestRunnerPage from "./pages/TestRunnerPage";
import DashboardPage from "./pages/DashboardPage";
import GuidePage from "./pages/GuidePage";
import PreviewRunnerPage from "./pages/PreviewRunnerPage";

function parsePath() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  return { parts, first: parts[0] || "" };
}

function navigateTo(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function isPlainLeftClick(event) {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}

function sameUser(previousSession, nextSession) {
  return previousSession?.user?.id && nextSession?.user?.id && previousSession.user.id === nextSession.user.id;
}

export default function App() {
  const [{ parts, first }, setRoute] = useState(parsePath());
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authChecked, setAuthChecked] = useState(!supabaseReady);
  const [profileChecked, setProfileChecked] = useState(false);

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

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setAuthChecked(true);
      setSession((previousSession) => {
        if (event === "SIGNED_OUT" || !nextSession) {
          setProfile(null);
          setProfileChecked(true);
          return null;
        }

        if (sameUser(previousSession, nextSession)) return nextSession;

        setProfile(null);
        setProfileChecked(false);
        return nextSession;
      });
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

      if (profile?.id === session.user.id) {
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
        setProfile({ id: session.user.id, email: session.user.email, role: "user", display_name: null });
      } else {
        setProfile(data || { id: session.user.id, email: session.user.email, role: "user", display_name: null });
      }

      setProfileChecked(true);
    }

    loadProfile();
    return () => { active = false; };
  }, [authChecked, session?.user?.id]);

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

  if (first === "test" && parts[1]) return <TestRunnerPage slug={parts[1]} />;
  if (first === "register") return <RegisterPage />;

  const firstAppLoad = !authChecked || (session?.user && !profileChecked && !profile);

  if (firstAppLoad) {
    return (
      <div className="page-shell">
        <main className="container narrow">
          <section className="card">Loading...</section>
        </main>
      </div>
    );
  }

  if (!session || !profile) return <LoginPage />;
  if (first === "guide") return <GuidePage profile={profile} />;
  if (first === "preview" && parts[1]) return <PreviewRunnerPage profile={profile} studyId={parts[1]} />;
  if (first === "builder" && parts[1]) return <StudyBuilderPage profile={profile} studyId={parts[1]} />;
  if (first === "dashboard" && parts[1]) return <DashboardPage profile={profile} studyId={parts[1]} />;

  return <StudyListPage profile={profile} />;
}
