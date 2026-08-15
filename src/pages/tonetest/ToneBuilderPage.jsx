import React, { useEffect, useState } from "react";
import AdminShell from "../../components/AdminShell";
import { supabase } from "../../lib/supabase";

function navigateTo(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function ToneBuilderPage({ profile, studyId }) {
  const [study, setStudy] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase.from("studies").select("*").eq("id", studyId).single();
      if (!active) return;

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setStudy(data);
      setLoading(false);
    }

    load();
    return () => { active = false; };
  }, [studyId]);

  if (loading) {
    return (
      <AdminShell profile={profile}>
        <section className="card">Loading...</section>
      </AdminShell>
    );
  }

  if (message) {
    return (
      <AdminShell profile={profile}>
        <section className="card">
          <p className="error-box">{message}</p>
          <button className="secondary-button" onClick={() => navigateTo("/")}>Back to test collection</button>
        </section>
      </AdminShell>
    );
  }

  return (
    <AdminShell profile={profile}>
      <section className="card">
        <h1>{study?.title || "Tone Test"}</h1>
        <p className="muted-text">
          This Tone Test has been created and saved. The setup screen for scenario, content goal, wording
          variants and reviewer roles is being built next.
        </p>
        <div className="button-row">
          <button className="secondary-button" onClick={() => navigateTo("/")}>Back to test collection</button>
        </div>
      </section>
    </AdminShell>
  );
}
