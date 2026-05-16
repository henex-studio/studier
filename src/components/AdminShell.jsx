import React from "react";
import AppHeader from "./AppHeader";

export default function AdminShell({ profile, children }) {
  return (
    <div className="page-shell">
      <AppHeader profile={profile} />
      <main className="container">{children}</main>
    </div>
  );
}
