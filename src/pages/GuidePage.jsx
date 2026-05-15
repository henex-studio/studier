import React from "react";
import AdminShell from "../components/AdminShell";

export default function GuidePage({ profile }) {
  return (
    <AdminShell profile={profile}>
      <section className="card guide-hero">
        <span className="badge">Guide</span>
        <h1>Studier user guide</h1>
        <p>
          This guide explains how to create, preview, publish, and review a tree test in Studier.
        </p>
        <div className="button-row">
          <a className="primary-button" href="/admin">
            Back to test collection
          </a>
        </div>
      </section>

      <section className="guide-layout">
        <aside className="card guide-toc">
          <h2>On this page</h2>
          <a href="#what-studier-is">What Studier is</a>
          <a href="#key-terms">Key terms</a>
          <a href="#create-test">Create a new test</a>
          <a href="#welcome-privacy">Welcome and privacy content</a>
          <a href="#tree">Add the menu tree</a>
          <a href="#tasks">Add tasks</a>
          <a href="#final-questions">Add final questions</a>
          <a href="#data-settings">Data collection settings</a>
          <a href="#save-publish">Save and publish</a>
          <a href="#results">View and export results</a>
          <a href="#close-test">Close a test</a>
          <a href="#good-practice">Good practice</a>
        </aside>

        <article className="card guide-content">
          <section id="what-studier-is">
            <h2>What Studier is</h2>
            <p>
              Studier is a small internal tool for running tree tests. A tree test helps check whether people can find information in a menu structure.
            </p>
            <p>
              A participant sees a task, looks at a menu, and chooses where they would go. Studier then records the selected path and shows results in a dashboard.
            </p>
          </section>

          <section id="key-terms">
            <h2>Key terms</h2>
            <p><strong>Test</strong> means one tree test project.</p>
            <p><strong>Tree</strong> means the menu structure that participants will use.</p>
            <p><strong>Task</strong> means the question shown to a participant.</p>
            <p><strong>Target path</strong> means the fully correct answer.</p>
            <p><strong>Acceptable path</strong> means an answer that is close enough to count as acceptable.</p>
            <p><strong>Final questions</strong> means the short questions shown after all tasks.</p>
            <p><strong>Published</strong> means the test link is open and participants can submit responses.</p>
            <p><strong>Closed</strong> means the test link is no longer open, but the dashboard and CSV export still work.</p>
          </section>

          <section id="create-test">
            <h2>Create a new test</h2>
            <ol>
              <li>Go to <strong>Test collection</strong>.</li>
              <li>Enter a title in <strong>New test title</strong>.</li>
              <li>Select <strong>Add new test</strong>.</li>
              <li>The builder page opens.</li>
            </ol>
            <p>Use a clear title, for example:</p>
            <pre><code>Payment information tree test</code></pre>
          </section>

          <section id="welcome-privacy">
            <h2>Add welcome and privacy content</h2>
            <p>In the builder page, fill in these fields:</p>
            <ol>
              <li><strong>Welcome note</strong>, explain what the participant will do.</li>
              <li><strong>What the test is</strong>, explain what kind of test this is.</li>
              <li><strong>Privacy note</strong>, tell participants not to enter personal information or case details.</li>
            </ol>
            <p>Do not ask participants to enter names, contact details, or real case information.</p>
          </section>

          <section id="tree">
            <h2>Add the menu tree</h2>
            <p>You can paste a CSV into <strong>IA tree CSV</strong>, or upload a CSV file.</p>
            <p>The CSV should look like this:</p>
            <pre><code>{`Level 1,Level 2,Level 3
Services,,
,Payments,
,,Apply for payment
,,Check payment status
Support,,
,Contact us,
,Complaints,`}</code></pre>
            <p>After adding the CSV, check the <strong>Tree preview</strong>.</p>
          </section>

          <section id="tasks">
            <h2>Add tasks</h2>
            <p>Each task should describe something the participant wants to find.</p>
            <pre><code>You want to apply for a payment. Where would you go?</code></pre>
            <ol>
              <li>Select a path in the tree preview.</li>
              <li>Select <strong>Add selected path as target</strong> if it is the fully correct answer.</li>
              <li>Select another path if needed.</li>
              <li>Select <strong>Add selected path as acceptable</strong> if it should count as acceptable.</li>
            </ol>
            <p>You can delete a task by selecting <strong>Delete task</strong>.</p>
          </section>

          <section id="final-questions">
            <h2>Add final questions</h2>
            <p>You can add two types of final questions:</p>
            <ol>
              <li>Choice question.</li>
              <li>Text question.</li>
            </ol>
            <p>Example choice question:</p>
            <pre><code>How easy was this menu to use?</code></pre>
            <p>Example options:</p>
            <pre><code>{`Very easy
Somewhat easy
Somewhat difficult
Very difficult`}</code></pre>
            <p>Example text question:</p>
            <pre><code>Any comments? Please do not include personal details.</code></pre>
            <p>You can delete a final question by selecting <strong>Delete question</strong>.</p>
          </section>

          <section id="data-settings">
            <h2>Choose data collection settings</h2>
            <p>Studier always collects the basic data needed to run the test:</p>
            <ol>
              <li>Selected path.</li>
              <li>Skip status.</li>
              <li>Task ID.</li>
              <li>Participant ID.</li>
              <li>Submission time.</li>
            </ol>
            <p>Recommended optional data settings are:</p>
            <ol>
              <li>Match type and correctness.</li>
              <li>Time taken.</li>
              <li>First click.</li>
              <li>Click count.</li>
            </ol>
            <p>More detailed options are click history, backtrack count, selected depth, and hesitation flag. Only collect the data you need.</p>
          </section>

          <section id="save-publish">
            <h2>Save and publish</h2>
            <ol>
              <li>Select <strong>Save test</strong>.</li>
              <li>Select <strong>Back to test collection</strong>.</li>
              <li>Select <strong>Publish</strong> when the test is ready.</li>
              <li>Select <strong>Copy link</strong> and send the copied link to participants.</li>
            </ol>
          </section>

          <section id="results">
            <h2>View and export results</h2>
            <p>Open the test dashboard from the test card. The dashboard shows participants, task answers, final surveys, exact answers, acceptable answers, wrong answers, and skipped answers.</p>
            <p>If a field says <strong>Not recorded</strong>, this means the data collection setting was not selected for that test.</p>
            <p>Use <strong>Export task CSV</strong> and <strong>Export final CSV</strong> to download results.</p>
          </section>

          <section id="close-test">
            <h2>Close a test</h2>
            <p>When data collection is finished, select <strong>Close</strong>.</p>
            <p>A closed test no longer accepts new participant responses. The dashboard and CSV export still work.</p>
          </section>

          <section id="good-practice">
            <h2>Good practice</h2>
            <ol>
              <li>Use plain task wording.</li>
              <li>Avoid leading the participant to the answer.</li>
              <li>Do not ask for personal information.</li>
              <li>Do not include real case details.</li>
              <li>Test the link yourself before sending it to participants.</li>
              <li>Close the test when data collection is complete.</li>
            </ol>
          </section>

          <section className="guide-bottom-actions">
            <a className="primary-button" href="/admin">
              Back to test collection
            </a>
          </section>
        </article>
      </section>
    </AdminShell>
  );
}
