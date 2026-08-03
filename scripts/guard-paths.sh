#!/usr/bin/env bash
#
# guard-paths.sh
#
# PreToolUse hook for Edit, Write and NotebookEdit.
# Reads the tool call on stdin, decides whether the target path may be written.
#
# Three outcomes, from project-config.json:
#   protected_paths  -> deny.  Refused outright.
#   review_paths     -> ask.   Halts and waits for the operator.
#   everything else  -> allow, if it falls under writable_paths, otherwise ask.
#
# Fails closed. If the script cannot evaluate the request, it denies rather than
# allowing, because a guard that fails open is not a guard.
#
# Implements H-4.3 and H-6.10. See harness-core/docs/decision-log.md.
#
# NOTE ON THE HOOK CONTRACT
# The stdin and stdout shapes below follow the Claude Code PreToolUse hook
# specification. Architecture Section 11 requires this to be verified against
# current documentation at setup time, because the hook system has changed
# several times. Run the three tests in harness-docs/guard-test.md before
# trusting it.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONFIG="$REPO_ROOT/project-config.json"

deny() {
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":%s}}\n' "$1"
  exit 0
}

ask() {
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":%s}}\n' "$1"
  exit 0
}

allow() {
  printf '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow","permissionDecisionReason":%s}}\n' "$1"
  exit 0
}

if [[ ! -f "$CONFIG" ]]; then
  deny '"guard-paths.sh could not find project-config.json. Failing closed."'
fi

if ! command -v node >/dev/null 2>&1; then
  deny '"guard-paths.sh requires node to parse JSON and node was not found. Failing closed."'
fi

INPUT="$(cat)"

RESULT="$(printf '%s' "$INPUT" | node -e '
const fs = require("fs");

let raw = "";
try { raw = fs.readFileSync(0, "utf8"); } catch (e) { raw = ""; }

function out(decision, reason) {
  process.stdout.write(JSON.stringify({ decision, reason }));
  process.exit(0);
}

let payload;
try {
  payload = JSON.parse(raw);
} catch (e) {
  out("deny", "guard-paths.sh could not parse the tool call on stdin. Failing closed.");
}

let cfg;
try {
  cfg = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
} catch (e) {
  out("deny", "guard-paths.sh could not parse project-config.json. Failing closed.");
}

const input = payload.tool_input || payload.toolInput || {};
let target = input.file_path || input.path || input.notebook_path || "";

if (!target) {
  out("allow", "No file path in the tool call. Nothing for the path guard to check.");
}

const root = process.argv[2];
let rel = target;
if (rel.startsWith(root)) rel = rel.slice(root.length);
rel = rel.replace(/^\/+/, "");

const norm = (p) => p.replace(/^\.\//, "").replace(/^\/+/, "");
const matches = (rule) => {
  const r = norm(rule);
  return r.endsWith("/") ? rel.startsWith(r) : rel === r;
};

const protectedPaths = cfg.protected_paths || [];
const reviewPaths = cfg.review_paths || [];
const writablePaths = cfg.writable_paths || [];

const hit = protectedPaths.find(matches);
if (hit) {
  out("deny",
    "BLOCKED by protected_paths. " + rel + " matches the rule \"" + hit + "\". " +
    "This path is existing Studier platform code, a credential file, or a harness governance file. " +
    "It is protected under H-4.3 and H-6.10. If this change is genuinely required, stop, report it, " +
    "and let the operator decide. Do not work around it.");
}

const rev = reviewPaths.find(matches);
if (rev) {
  const budget = cfg.review_line_budget || 30;
  out("ask",
    "REVIEW REQUIRED. " + rel + " is one of the nine shared files that Tone Test must touch (H-6.10 control two). " +
    "Edits here should be study-type dispatch only, routing to a new module under src/pages/tonetest/ or src/lib/tonetest/. " +
    "Expected size is under " + budget + " lines. A larger change means logic is leaking into shared platform code. " +
    "Operator: check the diff before approving.");
}

const w = writablePaths.find(matches);
if (w) {
  out("allow", "Within writable_paths (" + w + ").");
}

out("ask",
  rel + " is not listed in protected_paths, review_paths or writable_paths. " +
  "The path guard has no rule for it, so it stops rather than guessing. " +
  "Operator: either approve this once, or add the path to project-config.json.");
' "$CONFIG" "$REPO_ROOT")"

if [[ -z "$RESULT" ]]; then
  deny '"guard-paths.sh produced no decision. Failing closed."'
fi

DECISION="$(printf '%s' "$RESULT" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.parse(s).decision||"deny")}catch(e){process.stdout.write("deny")}})')"
REASON_JSON="$(printf '%s' "$RESULT" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(JSON.stringify(JSON.parse(s).reason||"no reason given"))}catch(e){process.stdout.write("\"guard-paths.sh could not read its own decision. Failing closed.\"")}})')"

case "$DECISION" in
  deny)  deny  "$REASON_JSON" ;;
  ask)   ask   "$REASON_JSON" ;;
  allow) allow "$REASON_JSON" ;;
  *)     deny  '"guard-paths.sh returned an unrecognised decision. Failing closed."' ;;
esac
