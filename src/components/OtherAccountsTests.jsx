import React from "react";
import { Network, MessageSquare } from "lucide-react";

// What an administrator sees of everyone else's work: enough to run the
// platform, nothing about what is being tested.
//
// Added 8 September 2026, with migration 022. Until then an administrator's
// test collection listed every account's studies by title, and the database
// let them open any of it: the wording, the questions, the participant
// answers. A tone test exists to check sensitive wording before it is
// published, so that was the wrong default.
//
// There are no links and no buttons here on purpose. Every one of them
// would now fail, because the access behind them is gone. A button that
// cannot work is worse than no button.
//
// The reference is the first six characters of the study's identifier. It
// is enough for an owner to recognise which of their own tests is meant,
// and it tells nobody else anything. The full identifier is deliberately
// not sent to the browser: combined with the link code it would reopen the
// door this closed.

const NZ_TIME_ZONE = "Pacific/Auckland";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-NZ", {
    timeZone: NZ_TIME_ZONE, day: "2-digit", month: "short", year: "numeric"
  }).format(date);
}

function statusClass(status) {
  if (status === "published") return "status-badge status-published";
  if (status === "closed") return "status-badge status-closed";
  return "status-badge status-draft";
}

function statusLabel(status) {
  if (status === "published") return "Published";
  if (status === "closed") return "Closed";
  return "Draft";
}

export default function OtherAccountsTests({ rows, error }) {
  if (error) {
    return (
      <section className="card">
        <h2>Other accounts</h2>
        <p className="error-box">Could not load the other accounts: {error}</p>
      </section>
    );
  }

  if (!rows) return null;

  return (
    <section className="card list-view-card">
      <div className="section-title-row">
        <div>
          <h2>Other accounts</h2>
          <p className="muted-text">
            Management data only. Titles, wording, questions and participant answers belong to the
            account that created the test and are not visible here.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="muted-text">No other account has created a test yet.</p>
      ) : (
        <div className="desktop-table test-list-table-wrap">
          <table className="test-list-table">
            <thead>
              <tr>
                <th>Owner</th>
                <th>Type</th>
                <th>Status</th>
                <th>Reference</th>
                <th>Participants</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const Icon = row.study_type === "tone_test" ? MessageSquare : Network;
                return (
                  <tr key={row.reference}>
                    <td>
                      <span className="owner-chip owner-chip-2" title={row.owner_email}>
                        {row.owner_name || row.owner_email || "Unknown user"}
                      </span>
                    </td>
                    <td>
                      <span className={row.study_type === "tone_test" ? "type-badge type-badge-tone" : "type-badge type-badge-tree"}>
                        <Icon size={14} strokeWidth={2.25} aria-hidden="true" />
                        {row.study_type === "tone_test" ? "Tone Test" : "Tree Test"}
                      </span>
                    </td>
                    <td><span className={statusClass(row.status)}>{statusLabel(row.status)}</span></td>
                    <td><span className="list-link-code">{row.reference}</span></td>
                    <td>
                      {/* Started and finished, not who or what they said. */}
                      {row.completed} of {row.participants}
                    </td>
                    <td className="muted-text">{formatDate(row.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
