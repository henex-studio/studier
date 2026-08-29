import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import TestRunnerPage from "../TestRunnerPage";
import ToneTestRunnerPage from "./ToneTestRunnerPage";

// The public link only carries a slug, so which runner to show is not
// known until the study is fetched. This is a separate lookup from
// whatever the chosen runner does afterwards; it exists only to answer
// one question, "which type is this," and get out of the way.
//
// This lives in a Tone Test folder because the writable folders are all
// named for Tone Test (project-config.json), even though this component
// serves both types. That is a limit of the current configuration, not a
// design choice, and it is better than putting real routing logic into
// App.jsx, which is a shared review-gated file.
export default function PublicTestRouter({ slug }) {
  const [loading, setLoading] = useState(true);
  const [studyType, setStudyType] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkType() {
      setLoading(true);
      const { data, error } = await supabase
        .from("studies")
        .select("study_type")
        .eq("slug", slug)
        .maybeSingle();

      if (!active) return;

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setStudyType(data.study_type);
      setLoading(false);
    }

    checkType();
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

  if (notFound) {
    return (
      <div className="page-shell">
        <main className="container narrow">
          <section className="card">
            <h1>Test unavailable</h1>
            <p>This test link is not available.</p>
          </section>
        </main>
      </div>
    );
  }

  if (studyType === "tone_test") return <ToneTestRunnerPage slug={slug} />;
  return <TestRunnerPage slug={slug} />;
}
