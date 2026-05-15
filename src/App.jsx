import React, { useEffect, useState } from "react";
import { supabase, supabaseReady } from "./lib/supabase";
import LoginPage from "./pages/LoginPage";
import StudyListPage from "./pages/StudyListPage";
import StudyBuilderPage from "./pages/StudyBuilderPage";
import TestRunnerPage from "./pages/TestRunnerPage";
import DashboardPage from "./pages/DashboardPage";

function parsePath() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  return { parts, first: parts[0] || "" };
}

export default function App() {
  const [{ parts, first }, setRoute] = useState(parsePath());
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onPop = () => setRoute(parsePath());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!supabaseReady) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => setSession(data.session || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user) { setProfile(null); setLoading(false); return; }
      const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
      setProfile(data || { id: session.user.id, email: session.user.email, role: "user" });
      setLoading(false);
    }
    loadProfile();
  }, [session]);

  if (!supabaseReady) return <LoginPage />;
  if (first === "test") return <TestRunnerPage slug={parts[1]} />;
  if (loading) return <div className="page-shell"><main className="container"><section className="card">Loading...</section></main></div>;
  if (!session || !profile) return <LoginPage />;
  if (first === "builder" && parts[1]) return <StudyBuilderPage profile={profile} studyId={parts[1]} />;
  if (first === "dashboard" && parts[1]) return <DashboardPage profile={profile} studyId={parts[1]} />;
  return <StudyListPage profile={profile} />;
}
