import React from "react";
import AdminShell from "../../components/AdminShell";

// Milestone 6 Step 4. The tone test guide, written for someone who has
// never run one. Lives here rather than in GuidePage.jsx because
// project-config.json puts a 30-line budget on review paths and an honest
// guide is well past that; this is the same reasoning that put the
// builder, the runner and the dashboard here.
//
// Register follows CLAUDE.md: plain language, every term defined once
// where it first appears, and no claim the tool does not actually make.
export default function ToneGuidePage({ profile }) {
  return (
    <AdminShell profile={profile}>
      <section className="card guide-hero">
        <span className="type-badge type-badge-tone">Tone test</span>
        <h1>Tone test guide</h1>
        <p>
          How to set up a tone test, what participants see, and how to read the results.
        </p>
        <div className="button-row">
          <a className="primary-button" href="/admin">Back to test collection</a>
          <a className="secondary-button" href="/guide">All guides</a>
        </div>
      </section>

      <section className="guide-layout">
        <aside className="card guide-toc">
          <h2>On this page</h2>
          <a href="#what-it-is">What a tone test is</a>
          <a href="#when">When to use one</a>
          <a href="#setup">Set the scene</a>
          <a href="#variants">Write the wordings</a>
          <a href="#roles">The three roles</a>
          <a href="#gates">Risk gates</a>
          <a href="#weights">Content Score weights</a>
          <a href="#questions">Questions</a>
          <a href="#modes">One wording or all of them</a>
          <a href="#publish">Preview and publish</a>
          <a href="#participants">What participants see</a>
          <a href="#results">Reading the results</a>
          <a href="#comments">Comments</a>
          <a href="#lifecycle">Close, export, and reuse</a>
          <a href="#good-practice">Good practice</a>
        </aside>

        <div className="card guide-content">
          <section id="what-it-is">
            <h2>What a tone test is</h2>
            <p>
              A tone test helps a team choose between two and four versions of the same message before
              it is published. Participants read a version, rate it, and answer in their own words.
              Reviewers also judge it against a fixed set of risk checks.
            </p>
            <p>
              Studier then gives each version a score, says how much that score can be relied on, and
              suggests whether the version is ready. It supports the decision. It does not make it, and
              it does not replace policy, legal, privacy, communications or accessibility sign-off.
            </p>
          </section>

          <section id="when">
            <h2>When to use one</h2>
            <p>
              Use a tone test when the words themselves are the thing in question. Typical cases are a
              letter or notice going to the public, a message people receive at a stressful moment, or
              wording where the team disagrees and needs evidence rather than opinion.
            </p>
            <p>
              Use a tree test instead when the question is whether people can find something in a menu.
              The two answer different questions and are set up differently.
            </p>
          </section>

          <section id="setup">
            <h2>Set the scene</h2>
            <p>Two fields at the top of the builder do most of the work of framing the test.</p>
            <p>
              <strong>Scenario</strong> is the situation the reader is in when they see this message.
              What is happening to them, and what did they just do.
            </p>
            <p>
              <strong>Content goal</strong> is what the wording has to achieve. What should the reader
              understand, feel, or do next.
            </p>
            <p>
              Both are shown to you while you review results, not to participants. Write them anyway.
              A reviewer judging whether wording is accurate needs to know what it was trying to do.
            </p>
            <figure className="guide-screenshot">
              <img src="/guide/03-create-tone-test.png" alt="New test title field filled in with Tone Test selected in the type dropdown, before Add new test is selected" />
              <figcaption>Creating a tone test starts the same way: a title, then Tone Test from the dropdown.</figcaption>
            </figure>
          </section>

          <section id="variants">
            <h2>Write the wordings</h2>
            <p>
              A tone test needs between two and four versions of the message. Each one gets a short
              label for your own use, the wording itself, and an optional internal note.
            </p>
            <p>
              Vary one thing at a time where you can. If one version is warmer, shorter, and adds a
              phone number, and it scores better, you will not know which change did the work. Two
              versions that differ in one clear way tell you more than four that differ in every way.
            </p>
            <p>
              Participants never see the labels or the notes, so name the versions in whatever way helps
              you keep track.
            </p>
          </section>

          <section id="roles">
            <h2>The three roles</h2>
            <p>
              Participants choose which role they are answering as before they start. Each role answers
              different questions, because each one knows something the others do not.
            </p>
            <p>
              <strong>Audience</strong> means the people the message is actually for. They supply
              evidence about what happened to them when they read it: whether it was clear, whether they
              knew what to do, whether it felt respectful. They answer no risk checks, because their job
              is to react rather than to judge.
            </p>
            <p>
              <strong>Agency</strong> means the organisation that owns the content and carries the
              consequences. They supply judgement, and they hold the only veto. They answer five of the
              six risk checks, including all four that can block a recommendation.
            </p>
            <p>
              <strong>Editor</strong> means a content professional who did not write any of the versions.
              They explain why wording reads the way it does: plain language, structure, jargon,
              readability.
            </p>
            <p>
              You can turn a role off if nobody suitable is available. Studier will warn you which risk
              checks will then have nobody to answer them. Turning off the Agency has the largest effect,
              since it answers every check that can block a recommendation.
            </p>
          </section>

          <section id="gates">
            <h2>Risk gates</h2>
            <p>
              A risk gate is a yes-or-no style judgement about whether wording is safe to publish. There
              are six, they are fixed by the platform, and you cannot add or remove them. Each is answered
              Pass, Concern or Fail.
            </p>
            <p>
              Four are <strong>critical</strong>: policy accuracy, safety risk, privacy and consent, and
              harm, blame and stigma. A single Fail on any of these means the version is not recommended,
              whatever it scored. The Agency answers all four.
            </p>
            <p>
              Two are not critical: operational promise, answered by the Agency, and accessibility and
              readability, answered by the Editor. A Fail on either still stops a version reaching the top
              recommendation, because someone judged there is a real problem, but it does not by itself
              block the version outright.
            </p>
            <p>
              Accessibility and readability is not marked critical for a specific reason. It reviews
              whether the copy is readable. It is not a compliance check against the accessibility
              standard, which is assessed separately against the published page. Marking it critical would
              imply a compliance judgement this test does not make.
            </p>
            <p>
              If a gate's role is turned off, or nobody answered as that role, the gate reads
              <strong> Not covered</strong> on the results screen. It never reads Pass by default. An
              uncovered critical gate holds the version back from the top two recommendations, because no
              risk review has actually happened.
            </p>
          </section>

          <section id="weights">
            <h2>Content Score weights</h2>
            <p>
              Each active role's ratings contribute to the Content Score, and you decide how much. The
              defaults are Audience 40, Agency 35, Editor 25. The weights of the roles you have turned on
              must total exactly 100 before the test can be published.
            </p>
            <p>
              Raise the Audience weight when the main question is how the message lands with the people
              receiving it. Raise the Agency weight when accuracy and organisational risk matter more than
              comfort. There is no correct answer, only a choice you should be able to explain later.
            </p>
            <figure className="guide-screenshot">
              <img src="/guide/05-tone-builder.png" alt="Tone test builder showing basics, content, roles and Content Score weights, and the risk gates table" />
              <figcaption>The builder: roles and weights sit above the fixed risk gates table.</figcaption>
            </figure>
          </section>

          <section id="questions">
            <h2>Questions</h2>
            <p>
              Each role comes with a set of questions already written, covering the things that role is
              there to judge. You can edit the wording. You cannot add or remove individual questions in
              this version.
            </p>
            <p>
              Rating questions are statements the participant agrees or disagrees with, on a scale of 1 to
              5, where 1 is strongly disagree and 5 is strongly agree. A participant can also answer
              <strong> Not applicable</strong>, which is left out of the score entirely rather than counted
              as a middling answer.
            </p>
            <p>
              Open questions ask for a few words in the participant's own writing. They are optional,
              because someone with nothing to say should not be made to invent something. They are usually
              where the most useful material comes from.
            </p>
          </section>

          <section id="modes">
            <h2>One wording or all of them</h2>
            <p>
              <strong>Single wording</strong> gives each participant one version, chosen at random and
              fixed for the rest of their session. This is closer to real life, since a reader normally
              sees one version of a message and has nothing to compare it against.
            </p>
            <p>
              <strong>Compare all</strong> shows every version to every participant, in an order fixed for
              that participant, and asks at the end which they preferred. This gives you a direct
              comparison, but participants know they are comparing, which is not how anyone reads a letter
              in real life.
            </p>
            <p>
              Single wording usually gives more honest reactions. Compare all gives more usable answers
              from a small number of participants.
            </p>
          </section>

          <section id="publish">
            <h2>Preview and publish</h2>
            <p>
              Preview by role, in the builder, shows what a participant would see after choosing each
              active role. It saves nothing.
            </p>
            <p>
              Publishing is blocked until the test is complete. Studier lists everything that is missing
              rather than stopping at the first problem: welcome and privacy content, scenario and content
              goal, two to four wordings each with text, at least one active role, wording for every
              required question, active weights totalling exactly 100, and a closing time that is not in
              the past.
            </p>
            <p>Once published, copy the link and send it to participants. They need no account.</p>
          </section>

          <section id="participants">
            <h2>What participants see</h2>
            <p>
              A participant opens the link, reads your welcome and privacy content, and chooses a role.
              Once they answer their first question the role is fixed for that session, so their answers
              stay consistent.
            </p>
            <p>
              They then see the wording, or all the wordings, and answer that role's questions. Rating and
              risk gate questions are asked once for each wording shown. Open questions are asked once
              overall, since they ask for a general reflection rather than a judgement on specific wording.
            </p>
            <p>
              They can leave and come back on the same browser and continue where they left off. Once they
              submit, reopening the link shows your end message rather than letting them answer twice.
            </p>
            <figure className="guide-screenshot">
              <img src="/guide/08-tone-participant.png" alt="Participant welcome screen with privacy note, followed by a Choose your role step listing Audience, Agency and Editor" />
              <figcaption>Welcome and privacy, then the role choice, before any wording is shown.</figcaption>
            </figure>
          </section>

          <section id="results">
            <h2>Reading the results</h2>
            <p>
              The dashboard shows three separate things for each wording. They answer different questions
              and are deliberately never combined into a single number.
            </p>
            <figure className="guide-screenshot">
              <img src="/guide/10-tone-dashboard.png" alt="Dashboard for a tone test showing session counts by role, then a wording's Content Score, Evidence Confidence and Recommendation" />
              <figcaption>One wording's results: score, confidence, and recommendation, side by side.</figcaption>
            </figure>

            <h3>Content Score</h3>
            <p>
              How the wording performed, from 0 to 100. Each active role's ratings are averaged and
              converted to that range, then combined using the weights you set. 70 and above is strong,
              50 to 69 is mixed, below 50 is weak.
            </p>
            <p>
              If a role answered nothing for a wording, its weight is removed and the remaining weights
              grow to fill the gap. A role that did not answer is never counted as a score of zero, which
              would make an unreviewed wording look worse than a badly reviewed one. That absence shows up
              in Evidence Confidence instead.
            </p>

            <h3>Evidence Confidence</h3>
            <p>
              How far the score can be trusted, shown as High, Medium or Low. It is about how much
              evidence you have, not how good the wording is, which is why it is kept out of the score.
            </p>
            <p>
              High means every active role has at least five people answering for that wording, and the
              roles are reasonably balanced. Medium means at least one active role has three or more. Low
              is anything less, including nothing at all. A large imbalance between roles pulls the level
              down, because hearing from thirty of one group and two of another is not the same as hearing
              from both.
            </p>
            <p>A warning appears when any active role has fewer than three answers. It blocks nothing.</p>

            <h3>Risk gate status</h3>
            <p>
              Each of the six gates shows Pass, Concern, Fail or Not covered, with critical gates marked.
              Where two people answered the same gate differently, the most serious answer is the one
              shown. A single Concern is worth reading even when everything else looks good.
            </p>

            <h3>Recommendation</h3>
            <p>
              A single label per wording, with the reason it was reached written next to it. The rules are
              applied in order and the first match wins.
            </p>
            <ol>
              <li><strong>Not recommended until revised</strong>, when any critical gate failed.</li>
              <li><strong>Insufficient evidence</strong>, when Evidence Confidence is Low.</li>
              <li><strong>Needs revision</strong>, when a critical gate has nobody to answer it.</li>
              <li><strong>Recommended for review</strong>, when the score is 70 or above, evidence is Medium or High, and no gate failed.</li>
              <li><strong>Recommended with caution</strong>, when the score is 50 or above with a gate at Concern and none at Fail.</li>
              <li><strong>Needs revision</strong> for anything else.</li>
            </ol>
            <p>
              The tool is deliberately cautious. A reviewer who marks Fail believes there is a real
              problem, and a label that ignored it would tell the team the Fail can be disregarded.
            </p>

            <h3>The blame flag</h3>
            <p>
              The Audience answers no risk gates, but their answers still matter to risk. When their
              average rating on "This message does not make me feel blamed" falls below a threshold you
              set for the test, Studier flags the harm, blame and stigma gate for the Agency's attention.
            </p>
            <p>
              The flag is a prompt to look, not a judgement already made. The Agency still decides. The
              default threshold is 3.5, and you can change it in the builder.
            </p>
          </section>

          <section id="comments">
            <h2>Comments</h2>
            <p>
              Comments left on a risk gate appear with that gate, under the wording they were about.
            </p>
            <p>
              Answers to open questions appear in their own section, grouped by role. They are not tied to
              a specific wording, because each participant answers them once for the whole session rather
              than once per version.
            </p>
          </section>

          <section id="lifecycle">
            <h2>Close, export, and reuse</h2>
            <p>
              Close the test when you have enough responses. Closing stops new answers. It does not delete
              anything, and the dashboard and exports stay available.
            </p>
            <p>
              Two exports are available from the dashboard. The responses file has one row per answer, for
              anyone who wants to analyse it elsewhere. The results file has one row per wording, carrying
              the same numbers the dashboard shows.
            </p>
            <p>
              To run a second round with the same setup, close the test, then use Clear data and publish.
              This deletes every response and republishes the same test. Your roles, weights, questions and
              wordings all survive. Export first if you want a copy, because clearing cannot be undone.
            </p>
            <p>
              A wording that has been answered cannot be deleted, since deleting it would delete those
              answers with it. To test different wording after a round, clear the data first, or add
              another version alongside it.
            </p>
          </section>

          <section id="good-practice">
            <h2>Good practice</h2>
            <ol>
              <li>Change one thing at a time between versions.</li>
              <li>Get the Agency to take part. Without it, every gate that can block a recommendation goes unanswered.</li>
              <li>Read the open comments before the scores. The numbers tell you which version, the comments tell you why.</li>
              <li>Treat a Low Evidence Confidence as a reason to get more responses, not a reason to distrust the tool.</li>
              <li>Never ask for real personal details, case details, or lived experience of harm.</li>
              <li>Use hypothetical scenarios when the content is sensitive.</li>
              <li>Export before clearing.</li>
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
