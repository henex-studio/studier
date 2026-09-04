import React from "react";
import AppHeader from "./AppHeader";
import FeedbackButton from "./FeedbackButton";

export default function AdminShell({ profile, children }) {
  return (
    <div className="page-shell">
      <AppHeader profile={profile} />
      <main className="container">{children}</main>
      <FeedbackButton />
    </div>
  );
}
