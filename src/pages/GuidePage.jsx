import React from "react";
import AdminShell from "../components/AdminShell";

// Milestone 6 Step 4. /guide is now a home page offering one guide per
// test type, and /guide/tree is this page's original tree test content,
// unchanged. The tone test guide is a separate component under
// src/pages/tonetest/.
function GuideHome({ profile }) {
  return (
    <AdminShell profile={profile}>
      <section className="card guide-hero">
        <span className="badge">Guide</span>
        <h1>Studier user guide</h1>
        <p>
          Studier runs two kinds of test. They are set up differently and their results are read
          differently, so each has its own guide.
        </p>
        <div className="button-row">
          <a className="primary-button" href="/admin">Back to test collection</a>
        </div>
      </section>

      <figure className="guide-screenshot">
        <img src="/guide/01-test-collection.png" alt="Test collection page showing a published tree test and a published tone test as cards" />
        <figcaption>Test collection: every test you create lives here, of either type.</figcaption>
      </figure>

      <section className="study-grid">
        <article className="card guide-type-card">
          <span className="type-badge type-badge-tree">Tree test</span>
          <div className="guide-type-card-body">
            <h2>Tree test guide</h2>
            <p>
              Check whether people can find information in a menu structure, before a site or service is
              built. Covers the IA tree, tasks and correct paths, and reading the results.
            </p>
          </div>
          <div className="button-row">
            <a className="primary-button" href="/guide/tree">Open tree test guide</a>
          </div>
        </article>

        <article className="card guide-type-card">
          <span className="type-badge type-badge-tone">Tone test</span>
          <div className="guide-type-card-body">
            <h2>Tone test guide</h2>
            <p>
              Check how wording lands before it is published. Covers the three reviewer roles, risk gates,
              scoring, and how to read a recommendation.
            </p>
          </div>
          <div className="button-row">
            <a className="primary-button" href="/guide/tone">Open tone test guide</a>
          </div>
        </article>
      </section>
    </AdminShell>
  );
}

export default function GuidePage({ profile, section }) {
  if (section !== "tree") return <GuideHome profile={profile} />;

  return (
    <AdminShell profile={profile}>
      <section className="card guide-hero">
        <span className="type-badge type-badge-tree">Tree test</span>
        <h1>Tree test guide</h1>
        <p>
          This guide explains how to create, preview, publish, close, reuse, and review a tree test.
        </p>
        <div className="button-row">
          <a className="primary-button" href="/admin">Back to test collection</a>
          <a className="secondary-button" href="/guide">All guides</a>
        </div>
      </section>

      <section className="guide-layout">
        <aside className="card guide-toc">
          <h2>On this page</h2>
          <a href="#what-studier-is">What Studier is</a>
          <a href="#key-terms">Key terms</a>
          <a href="#create-test">Create a new test</a>
          <a href="#welcome-privacy">Welcome, privacy, and end content</a>
          <a href="#pre-task-questions">Pre task questions</a>
          <a href="#tree">Add the IA tree</a>
          <a href="#tasks">Add tasks and correct paths</a>
          <a href="#final-questions">Final questions</a>
          <a href="#data-settings">Data collection settings</a>
          <a href="#closing-time">Closing time</a>
          <a href="#preview-publish">Preview and publish</a>
          <a href="#participant-experience">Participant experience</a>
          <a href="#results">View and export results</a>
          <a href="#close-reuse">Close, clear, and reuse a test</a>
          <a href="#good-practice">Good practice</a>
        </aside>

        <div className="card guide-content">
          <section id="what-studier-is">
            <h2>What Studier is</h2>
            <p>
              Studier is an internal tool for running small user tests. It supports two kinds of test, and you choose which one when you create it.
            </p>
            <p>
              A <strong>tree test</strong> checks whether people can find information in a menu structure, before a full website or service is built. A participant sees one task at a time, opens the menu tree, and chooses where they would go. Studier records the selected path.
            </p>
            <p>
              A <strong>tone test</strong> checks how wording lands before it is published. Participants read one or more versions of the same message, rate it, and answer in their own words. Reviewers also judge it against a fixed set of risk gates. Studier scores each version and shows how much the result can be relied on.
            </p>
            <p>
              Both kinds record results in a dashboard you can read on screen or export. The rest of this guide covers tree tests; the tone test guide is separate.
            </p>
          </section>

          <section id="key-terms">
            <h2>Key terms</h2>
            <p><strong>Test</strong> means one test project, of either kind.</p>
            <p><strong>Tree</strong> means the IA menu structure that participants use.</p>
            <p><strong>Task</strong> means the scenario or question shown to a participant.</p>
            <p><strong>Target path</strong> means the fully correct answer.</p>
            <p><strong>Acceptable path</strong> means an answer that is close enough to count as acceptable.</p>
            <p><strong>Pre task questions</strong> means optional questions shown before the tree tasks.</p>
            <p><strong>Final questions</strong> means optional questions shown after all tasks.</p>
            <p><strong>Published</strong> means the public test link is open.</p>
            <p><strong>Closed</strong> means the public test link no longer accepts new responses, while the dashboard and exports stay available.</p>
          </section>

          <section id="create-test">
            <h2>Create a new test</h2>
            <ol>
              <li>Go to Test collection.</li>
              <li>Enter a title in New test title.</li>
              <li>Select Add new test.</li>
              <li>The builder page opens automatically.</li>
            </ol>
            <p>Use a clear title, for example:</p>
            <pre>Driver licence renewal navigation test</pre>
            <figure className="guide-screenshot">
              <img src="/guide/02-create-tree-test.png" alt="New test title field filled in with Tree Test selected in the type dropdown, before Add new test is selected" />
              <figcaption>Enter a title, choose Tree Test, then select Add new test.</figcaption>
            </figure>
          </section>

          <section id="welcome-privacy">
            <h2>Welcome, privacy, and end content</h2>
            <p>In the builder page, fill in these fields before publishing:</p>
            <ol>
              <li><strong>Welcome note</strong>, explain what the participant will do.</li>
              <li><strong>What the test is</strong>, explain that this is a tree test and not a knowledge test.</li>
              <li><strong>Privacy note</strong>, tell participants not to enter names, contact details, case details, or other personal information.</li>
              <li><strong>End text</strong>, shown after the participant submits the test.</li>
            </ol>
            <p>Keep the wording plain and short. The participant should know what to do before they start.</p>
            <figure className="guide-screenshot">
              <img src="/guide/04-tree-builder.png" alt="Edit test page showing the Title, Welcome note, What the test is, and Privacy note fields filled in" />
              <figcaption>These fields sit at the top of the builder, above the tree and tasks.</figcaption>
            </figure>
          </section>

          <section id="pre-task-questions">
            <h2>Pre task questions</h2>
            <p>
              Pre task questions are optional. Use them only when broad background information would help with analysis.
            </p>
            <p>Use broad, non identifying questions. Do not ask for names, emails, case details, small team identifiers, or sensitive personal information.</p>
            <p>Pre task questions can be choice questions or text questions.</p>
          </section>

          <section id="tree">
            <h2>Add the IA tree</h2>
            <p>You can paste a CSV into IA tree CSV, or upload a CSV file.</p>
            <p>The CSV should use level columns, for example:</p>
            <pre>{`Level 1,Level 2,Level 3
Services,,
,Payments,
,,Apply for payment
,,Check payment status
Support,,
,Contact us,
,Complaints,`}</pre>
            <p>After adding the CSV, check the Tree preview and the CSV checks. Fix errors before publishing.</p>
          </section>

          <section id="tasks">
            <h2>Add tasks and correct paths</h2>
            <p>Each task should describe something the participant wants to find.</p>
            <pre>You want to apply for a payment. Where would you go?</pre>
            <ol>
              <li>Select a path in the tree preview.</li>
              <li>Select Add selected path as target if it is the fully correct answer.</li>
              <li>Select another path if needed.</li>
              <li>Select Add selected path as acceptable if it should count as acceptable.</li>
            </ol>
            <p>You can add more than one target path or acceptable path. You can also remove a path from a task.</p>
          </section>

          <section id="final-questions">
            <h2>Final questions</h2>
            <p>Final questions are optional and appear after the participant completes all tasks.</p>
            <p>You can add choice questions and text questions.</p>
            <p>Example choice question:</p>
            <pre>How easy was this menu to use?</pre>
            <p>Example text question:</p>
            <pre>Any comments? Please do not include personal details.</pre>
          </section>

          <section id="data-settings">
            <h2>Data collection settings</h2>
            <p>Studier always collects the basic data needed to run the test:</p>
            <ol>
              <li>Selected path.</li>
              <li>Skip status.</li>
              <li>Task ID.</li>
              <li>Participant ID.</li>
              <li>Submission time.</li>
            </ol>
            <p>Recommended optional data settings are match type and correctness, time taken, first click, and click count.</p>
            <p>More detailed options include click history, backtrack count, selected depth, and hesitation flag. Only collect the data that you need.</p>
          </section>

          <section id="closing-time">
            <h2>Closing time</h2>
            <p>You can set a test closing time in New Zealand time. After the closing time passes, the test link will show a closed message and will not accept new responses.</p>
            <p>If no closing time is set, the test stays open until you close it manually.</p>
          </section>

          <section id="preview-publish">
            <h2>Preview and publish</h2>
            <ol>
              <li>Select Save test before previewing recent changes.</li>
              <li>Select Preview test to check the participant flow without saving responses.</li>
              <li>Return to Test collection.</li>
              <li>Select Publish when the test is ready.</li>
              <li>Select Copy link and send the test link to participants.</li>
            </ol>
            <p>Studier checks key setup requirements before publishing. If something is missing, the publish action shows what needs to be fixed.</p>
            <figure className="guide-screenshot guide-screenshot-narrow">
              <img src="/guide/06-publish-check.png" alt="A draft test card after selecting Publish, showing a box listing what is missing before it can go live" />
              <figcaption>Selecting Publish before the test is ready lists exactly what to fix.</figcaption>
            </figure>
          </section>

          <section id="participant-experience">
            <h2>Participant experience</h2>
            <p>Participants see one task at a time. The tree starts collapsed so the first click can reflect the participant's first instinct.</p>
            <p>Participants can use the task progress navigation to review completed tasks. Submitted answers are locked in review mode and cannot be changed.</p>
            <p>When reviewing a completed task, the tree opens to the submitted answer path so the participant can see where the answer was selected.</p>
            <figure className="guide-screenshot">
              <img src="/guide/07-tree-participant.png" alt="Participant welcome screen showing the test title, welcome note, what the test is, and privacy note, with a Start test button" />
              <figcaption>What a participant sees before starting: welcome, what the test is, and privacy.</figcaption>
            </figure>
          </section>

          <section id="results">
            <h2>View and export results</h2>
            <p>Open the dashboard from the test card. The dashboard shows task responses, final question responses, exact answers, acceptable answers, wrong answers, skipped answers, and other collected fields.</p>
            <p>If a field says Not recorded, the related data collection setting was not selected for that test.</p>
            <p>Use Export task CSV and Export final CSV to download results.</p>
            <figure className="guide-screenshot">
              <img src="/guide/09-tree-dashboard.png" alt="Dashboard showing participant, task answer, exact, acceptable, and wrong counts, plus a per-answer table" />
              <figcaption>The dashboard, with results from a small pilot run.</figcaption>
            </figure>
          </section>

          <section id="close-reuse">
            <h2>Close, clear, and reuse a test</h2>
            <p>When data collection is finished, select Close. Closing a test does not delete response data.</p>
            <p>For a closed or draft test, you can select Clear test data to delete response data for that test. This removes task responses, final question responses, and participant session records for that test.</p>
            <p>For a closed or draft test, you can select Clear data and publish to clear old response data and publish the same test again.</p>
            <p>Clearing response data is permanent. Export data first if you need a copy.</p>
          </section>

          <section id="good-practice">
            <h2>Good practice</h2>
            <ol>
              <li>Use plain task wording.</li>
              <li>Avoid leading the participant to the answer.</li>
              <li>Do not ask for personal information.</li>
              <li>Do not include real case details.</li>
              <li>Preview the test before publishing.</li>
              <li>Export results before clearing test data.</li>
              <li>Close the test when data collection is complete.</li>
            </ol>
          </section>

          <div className="guide-bottom-actions">
            <a className="primary-button" href="/admin">Back to test collection</a>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
