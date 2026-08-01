# Scenario Golden Baselines

`npm run scenarios:golden` compares deterministic structured calls. `-- --update` is the only update path. Baselines contain action, domain, urgency, reason codes, missing signals, quality, and secondary domains—never prose, runtime timestamps, random IDs, traces, or score dumps. Diffs classify changes as `EXPECTED_IMPROVEMENT`, `EXPECTED_CHANGE`, `REGRESSION`, or `UNRESOLVED`; automatic comparisons default ambiguous changes to unresolved.
