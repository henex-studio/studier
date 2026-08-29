import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

// Milestone 3, Step 2. Deliberately close to empty. Its only job right
// now is to prove PublicTestRouter reaches a Tone Test screen rather than
// the Tree Test one. Welcome content, privacy content and role selection
// are Step 3; wording and questions are Step 4; submitting is Step 5;
// closed-test handling is Step 6.
export default function ToneTestRunnerPage({ slug }) {
  const [loading, setLoading] = useState(true);
  const [study, setStudy] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      const { data, error } = await supabase
        .from("studies")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!active) return;

      if (error || !data) {
        setMessage("This test link is not available.");
        setLoading(false);
        return;
      }

      setStudy(data);
      setLoading(false);
    }

    load();
    return () => { active = false; };
  }, [slug]);

  if (loading) {
    return (
      <div className="page-shell">
        <main className="container narrow">
          <section className="card">Loading...</section>
        </main>
      </div>
    );
  }

  if (!study) {
    return (
      <div className="page-shell">
        <main className="container narrow">
          <section className="card">
            <h1>Test unavailable</h1>
            <p>{message}</p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <main className="container narrow">
        <section className="card">
          <h1>{study.title || "Tone Test"}</h1>
          <p className="muted-text">
            This is the Tone Test participant screen. Welcome content, role selection and
            questions arrive in the next steps of Milestone 3.
          </p>
        </section>
      </main>
    </div>
  );
}
