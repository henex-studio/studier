import React from "react";
import AdminShell from "../components/AdminShell";

export default function GuidePage({ profile }) {
  return (
    <AdminShell profile={profile}>
      <section className="card guide-hero">
        <span className="badge">Guide</span>
        <h1>Studier user guide</h1>
        <p>
          This guide explains how to create, preview, publish, close, reuse, and review a tree test in Studier.
        </p>
        <div className="button-row">
          <a className="primary-button" href="/admin">Back to test collection</a>
          <a className="secondary-button" href="#version-history">Version history</a>
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
          <a href="#version-history">Version history</a>
        </aside>

        <div className="card guide-content">
          <section id="what-studier-is">
            <h2>What Studier is</h2>
            <p>
              Studier is an internal tool for running tree tests. A tree test helps check whether people can find information in a menu structure before a full website or service is built.
            </p>
            <p>
              A participant sees one task at a time, opens the menu tree, and chooses where they would go. Studier records the selected path and shows the results in a dashboard.
            </p>
          </section>

          <section id="key-terms">
            <h2>Key terms</h2>
            <p><strong>Test</strong> means one tree test project.</p>
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
            <pre>Victims information navigation test</pre>
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
          </section>

          <section id="participant-experience">
            <h2>Participant experience</h2>
            <p>Participants see one task at a time. The tree starts collapsed so the first click can reflect the participant's first instinct.</p>
            <p>Participants can use the task progress navigation to review completed tasks. Submitted answers are locked in review mode and cannot be changed.</p>
            <p>When reviewing a completed task, the tree opens to the submitted answer path so the participant can see where the answer was selected.</p>
          </section>

          <section id="results">
            <h2>View and export results</h2>
            <p>Open the dashboard from the test card. The dashboard shows task responses, final question responses, exact answers, acceptable answers, wrong answers, skipped answers, and other collected fields.</p>
            <p>If a field says Not recorded, the related data collection setting was not selected for that test.</p>
            <p>Use Export task CSV and Export final CSV to download results.</p>
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

          <section id="version-history">
            <h2>Version history</h2>
            <p>This section lists functional updates only. Small visual polish and development process details are not included.</p>

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
        </div>
      </section>
    </AdminShell>
  );
}
