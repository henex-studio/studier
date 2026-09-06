import React from "react";
import Hero from "../components/Hero";

// Before this page existed, App.jsx's final fallthrough rendered
// StudyListPage for any unrecognised path once signed in, and LoginPage for
// any unrecognised path signed out. A stale bookmark or a typo in a URL
// looked like a working page with no indication the address was wrong.
// Audit finding B3.
export default function NotFoundPage() {
  return (
    <div className="page-shell">
      <main className="container narrow">
        <section className="card hero-card">
          <Hero />
          <h1>Page not found</h1>
          <p>There is nothing at this address. It may have been moved, or the link may be out of date.</p>
          <p className="auth-switch-text">
            <a href="/admin">Back to test collection</a>
          </p>
        </section>
      </main>
    </div>
  );
}
