# Scenario Calibration System

`scenario-calibration.mjs` bundles 65 deterministic fixtures across 18 categories and five roles plus cross-role cases. Each declares input events/projections, expected and alternative calls, forbidden actions, urgency, required reasons, missing signals and notes.

Run `npm run scenarios`, add `-- --category mid`, `-- --failures-only`, or `--json`. Reports include totals, role/phase distribution, forbidden-action violations, average confidence and safe fallbacks. `/scenarios` is the development workbench entry point backed by Mock/Replay provider contracts; it is not a production screen.
