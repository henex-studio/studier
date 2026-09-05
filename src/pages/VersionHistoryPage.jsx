import React from "react";
import AdminShell from "../components/AdminShell";

// Moved out of GuidePage.jsx in Milestone 6 Step 3. It was a section of the
// tree test guide, which stopped making sense once the guide split in two
// and the history covered both halves of the product.
//
// Numbering: tree test releases run v1.00 to v3.07 and keep their original
// numbers. Tone test work is numbered from v4.00, one entry per milestone
// actually built, at the operator's instruction on 30 August 2026.
export default function VersionHistoryPage({ profile }) {
  return (
    <AdminShell profile={profile}>
      <section className="card guide-hero">
        <span className="badge">Version history</span>
        <h1>Studier version history</h1>
        <p>
          Functional updates only. Small visual polish and development process details are not listed.
        </p>
        <div className="button-row">
          <a className="primary-button" href="/admin">Back to test collection</a>
        </div>
      </section>

      <section className="card guide-content">
        <section>
          <h2>Tone tests</h2>
          <p className="muted-text">
            A second kind of test, for checking how wording lands before it is published.
          </p>

          <h3>v4.04, Lifecycle, export, and guides</h3>
          <ol>
            <li>Added clearing response data and reusing a tone test for a new round.</li>
            <li>Added CSV export of both raw responses and per-wording results.</li>
            <li>Blocked deleting a wording that has already been answered.</li>
            <li>Split the guide into a tree test guide and a tone test guide, and moved version history to its own page.</li>
            <li>Added an account page for changing your display name.</li>
          </ol>

          <h3>v4.03, Results</h3>
          <ol>
            <li>Added the tone test dashboard: Content Score per wording, and each role's contribution to it.</li>
            <li>Added Evidence Confidence, showing how far a score can be relied on, kept separate from the score itself.</li>
            <li>Added risk gate status per wording, including Not covered when a role was turned off.</li>
            <li>Added the recommendation status, with the reason it was reached stated in plain words.</li>
            <li>Added the automatic flag raised for the Agency when the Audience reports feeling blamed.</li>
            <li>Added open comments grouped by role, and gate comments shown with their gate.</li>
          </ol>

          <h3>v4.02, Participant flow</h3>
          <ol>
            <li>Added the public tone test link, with the participant choosing which role they are answering as.</li>
            <li>Added wording assignment: one version per participant, or all versions to compare, fixed for the session so a reload does not change it.</li>
            <li>Added rating, risk gate, and open text answering, with a Not applicable option that is excluded from scoring.</li>
            <li>Added submission, returning to an unfinished test, and the completion screen.</li>
          </ol>

          <h3>v4.01, Configuration and publishing</h3>
          <ol>
            <li>Added the three reviewer roles, each able to be turned off, with a warning naming the risk gates that would then have no respondent.</li>
            <li>Added Content Score weights per role, which must total exactly 100 before publishing.</li>
            <li>Added the six fixed risk gates and showed which are critical.</li>
            <li>Added editable question wording for each role.</li>
            <li>Added preview by role, and the publishing checks specific to a tone test.</li>
          </ol>

          <h3>v4.00, Create a tone test</h3>
          <ol>
            <li>Added tone test as a second test type, chosen when a test is created.</li>
            <li>Added the tone test builder: scenario, content goal, and participant-facing content.</li>
            <li>Added two to four wording variants per test.</li>
          </ol>
        </section>

        <section>
          <h2>Tree tests</h2>
          <p className="muted-text">
            The original Studier, for checking whether people can find things in a menu structure.
          </p>

          <h3>v3.07, Guide and version access</h3>
          <ol>
            <li>Added the current Studier version number to the top navigation.</li>
            <li>Added a direct link from the version number to this version history.</li>
            <li>Updated the guide to reflect current test setup, publishing, closing, review, export, and reuse features.</li>
          </ol>

          <h3>v3.06, Clear test data and republish</h3>
          <ol>
            <li>Added Clear test data for closed or draft tests.</li>
            <li>Added Clear data and publish so the same test can be reused for a new round of responses.</li>
            <li>Added owner and admin delete permissions for response data.</li>
          </ol>

          <h3>v3.05, Data cleaning support</h3>
          <ol>
            <li>Added support for cleaning task response and final question exports.</li>
            <li>Added checks to compare response paths with the IA tree CSV version.</li>
          </ol>

          <h3>v3.04, Analytics support</h3>
          <ol>
            <li>Added Vercel Analytics setup support for the deployed Studier app.</li>
          </ol>

          <h3>v3.03, Test review improvements</h3>
          <ol>
            <li>Added task progress navigation for participants.</li>
            <li>Added locked review mode for submitted tasks.</li>
            <li>Added automatic tree expansion to the submitted answer path during review.</li>
          </ol>

          <h3>v3.02, Test lifecycle improvements</h3>
          <ol>
            <li>Added test closing time.</li>
            <li>Added closed test page for expired or manually closed tests.</li>
            <li>Added reopen support by publishing again with a valid future closing time.</li>
          </ol>

          <h3>v3.01, Preview and navigation support</h3>
          <ol>
            <li>Added preview mode links back to the editor and test collection.</li>
            <li>Improved movement between current and completed tasks.</li>
          </ol>

          <h3>v2.00, Builder and publishing checks</h3>
          <ol>
            <li>Added pre task questions.</li>
            <li>Added CSV checks for IA tree setup.</li>
            <li>Added readiness checks before publishing.</li>
            <li>Added list view in the test collection.</li>
          </ol>

          <h3>v1.00, Initial MVP</h3>
          <ol>
            <li>Added core tree test setup.</li>
            <li>Added IA tree upload, task setup, participant test runner, response capture, and dashboard export basics.</li>
          </ol>
        </section>

        <div className="guide-bottom-actions">
          <a className="primary-button" href="/admin">Back to test collection</a>
        </div>
      </section>
    </AdminShell>
  );
}
