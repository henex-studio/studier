# artifacts

Handoff, evidence and recovery files. Written by the harness, read by the operator and by later sessions.

```text
plans/         <plan-id>.json          Planner output. Tasks, criteria, dependencies, risks
reports/       <task-id>-implementation.json   Generator's own account
               <task-id>-verification.json     verify.sh output, deterministic
               <task-id>-evaluation.json       Evaluator verdict
evaluations/   reserved
```

These are under version control. They are the record of what was decided, built and judged, and they are what makes a run reconstructable after the session that produced it is gone.
