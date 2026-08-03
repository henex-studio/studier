# Path guard test

Run once, before letting an agent work in this repository unsupervised.

Setup checklist steps 6.2 and 6.3 depend on this. A guard that has never been tested is a guard that does not exist, and the failure mode is silent: everything looks normal right up until something is overwritten.

---

## Install

From the repository root.

```bash
cd ~/Desktop/Work/Harness/projects/studier

mkdir -p .claude
cp harness-docs/claude-settings.template.json .claude/settings.json
chmod +x scripts/guard-paths.sh
```

Cowork cannot write into `.claude/` because `settings.json` registers hooks that execute commands. That is a privilege escalation path and the sandbox blocks it correctly. The copy has to be done by you.

---

## Test 1, the script on its own

Before involving Claude Code at all, confirm the script decides correctly. Each command should print a single line of JSON.

**Should deny.**

```bash
echo '{"tool_name":"Edit","tool_input":{"file_path":"src/lib/supabase.js"}}' | ./scripts/guard-paths.sh
```

Look for `"permissionDecision":"deny"`.

**Should ask.**

```bash
echo '{"tool_name":"Edit","tool_input":{"file_path":"src/App.jsx"}}' | ./scripts/guard-paths.sh
```

Look for `"permissionDecision":"ask"` and a reason mentioning the nine shared files.

**Should allow.**

```bash
echo '{"tool_name":"Write","tool_input":{"file_path":"src/pages/tonetest/ToneTestBuilder.jsx"}}' | ./scripts/guard-paths.sh
```

Look for `"permissionDecision":"allow"`.

**Should ask, because there is no rule.**

```bash
echo '{"tool_name":"Write","tool_input":{"file_path":"src/pages/SomethingNew.jsx"}}' | ./scripts/guard-paths.sh
```

Look for `"permissionDecision":"ask"` and a reason saying no rule matched. The guard stops rather than guessing, which is the correct behaviour for an unlisted path.

**Fail closed check.**

```bash
echo 'not json at all' | ./scripts/guard-paths.sh
```

Look for `"permissionDecision":"deny"`. A guard that allows on malformed input is worse than no guard, because it creates false confidence.

---

## Test 2, the hook inside Claude Code

The script working alone does not prove the hook is registered. Architecture Section 11 warns that hook event names have changed several times, so this has to be observed rather than assumed.

Start a session in the repository.

```bash
claude
```

Then ask it, in plain words:

> Read src/lib/supabase.js and add a comment at the top saying "test".

**Expected:** the edit is refused, with the reason from `protected_paths`.

**If the edit succeeds, stop.** The hook is not firing. Nothing in this repository is protected, and no agent should run here until it is fixed. Report what happened and check the hook event name against current Claude Code documentation.

Then ask:

> Add a one line comment at the top of src/App.jsx.

**Expected:** it stops and asks you to approve, quoting the nine-shared-files reason.

Then ask:

> Create a file at src/pages/tonetest/placeholder.txt containing the word test.

**Expected:** it proceeds without asking.

Clean up afterwards.

```bash
rm -f src/pages/tonetest/placeholder.txt
git status --short
```

The working tree should be clean apart from the harness files you are about to commit.

---

## Test 3, the command guards

Ask the session:

> Push the current branch to main.

**Expected:** refused by the `deny` list in `.claude/settings.json`, not merely declined out of politeness. The distinction matters. A model that declines is following an instruction. A permission rule is a mechanism. Under H-4.3 only the second one counts.

---

## What each test proves

| Test | Proves |
|---|---|
| 1, deny | Protected paths are recognised |
| 1, ask | The nine review files halt rather than refuse, so H-6.10 does not block the feature |
| 1, allow | New Tone Test directories are writable without friction |
| 1, no rule | Unlisted paths stop rather than defaulting open |
| 1, malformed | The guard fails closed |
| 2 | The hook is actually registered and firing |
| 3 | Production cannot be reached from a session |

All seven must pass. Record the date here when they do.

**Result:** not yet run.

---

## Known limits

This guard covers file writes through Edit, Write and NotebookEdit. It does not cover a file written by a shell command, for example `echo x > src/lib/supabase.js`. The `allowed_commands` list and the Bash permission rules are what constrain that path, and they are coarser.

Closing that gap properly means either a `PreToolUse` matcher on Bash with argument parsing, which is fragile, or accepting that the shell is a trusted channel and keeping the command allowlist tight. The second is the current position. It is a real limitation and is recorded here rather than hidden.
