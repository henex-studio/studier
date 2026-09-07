import React from "react";
import { CheckCircle2 } from "lucide-react";

// The card a participant sees when there is nothing left to do: finished,
// closed, or a preview that has run to the end.
//
// Shared because there were three of these written out by hand and they had
// already stopped matching. A tone test's ending was a bare card with two
// lines of text while a tree test's had a tick and a heading, so the same
// platform said goodbye two different ways depending on which test someone
// had been sent. Reported by the operator on 7 September 2026.
//
// `children` carries the buttons a preview needs. A participant's ending has
// none, on purpose: there is nowhere for them to go.
export default function DoneCard({ heading, paragraphs = [], children }) {
  return (
    <section className="card done-card">
      <CheckCircle2 className="done-icon" />
      <h1>{heading}</h1>
      {paragraphs.map((text, index) => <p key={index}>{text}</p>)}
      {children}
    </section>
  );
}
