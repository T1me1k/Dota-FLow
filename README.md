# Dota Flow — Product Foundation 0.20

Dota Flow is an explainable, local-first live coaching assistant for Dota 2. A canonical event pipeline normalizes permitted telemetry and keeps macro, role, lane, objective, power-spike, adaptive-build, personal-coach and post-match review decisions replayable. It never controls the hero or invents hidden game state.

## 0.20 coverage

- 127 recognized heroes: 32 `DETAILED`, 95 conservative `BASELINE` profiles;
- Match Review timeline, outcome windows, decision-quality metrics and JSONL import/JSON export;
- Lane Matchup and Objective engines with safe quality-aware fallbacks and histories;
- specialized Role Engines v2, expanded draft dimensions and build-switch hysteresis;
- local Personal Coach settings/migrations and learning profile;
- React + TypeScript + Vite + Tailwind desktop source with 12 unified screens;
- patch/content metadata, validation, migrations and coverage CLI.

## Commands

```bash
npm test
npm run check
npm run replay
npm run diagnose
npm run live
npm run overlay
npm run roles
npm run role-context
npm run manual-context
npm run coach
npm run review
npm run lanes
npm run objectives
npm run personal-coach
npm run content:validate
npm run content:list
npm run content:coverage
npm run content:migrate
npm run desktop:build
npm run preflight
npm run validate:match -- --release
```

Run `npm run mock` for legacy browser tools. Run `npm run desktop:dev` after installing `apps/desktop` dependencies to open the new desktop workspace; `/review` selects Match Review directly.

## Honest data boundary

`LIVE` is reserved for permitted, observed GEP signals. Visible facts confirmed by the user remain `MANUAL`; conservative derivations remain `INFERRED`; expired values become `STALE`; absent capabilities are `UNAVAILABLE`. Lane movement and objectives degrade to safe preparation/hold calls without current evidence. Baseline and unknown heroes never receive a fabricated hero-specific item plan.

Fixtures, CLI output and browser cards are simulations. Real Dota GEP, transparent overlay behavior, Windows performance, Overwolf approval/whitelisting, packaging, signing and installation have **not** been validated here and remain production work. Start with `START_HERE.md` and the implementation notes in `docs/`.

## v0.20.1 Hardening & Integration

Role Engines v2 are the primary pipeline route; the legacy coordinator is retained only as an explicitly named compatibility fallback. Runtime provider and desktop build boundaries are documented in [the integration audit](docs/V020_INTEGRATION_AUDIT.md) and [desktop status](docs/DESKTOP_BUILD_STATUS.md). Use `npm run desktop:validate` offline; `npm run desktop:build` is a real Vite build and needs installed frontend dependencies.

## v0.21.0 — Decision Orchestrator

Dota Flow now presents one conflict-free `coachCall`, backed by a compact trace, bounded history and 65-scenario calibration suite. See [orchestrator](docs/DECISION_ORCHESTRATOR_IMPLEMENTED.md), [contract](docs/COACH_CALL_CONTRACT.md), and [priority matrix](docs/V021_DECISION_PRIORITY_MATRIX.md). Run `npm run scenarios`; use `/scenarios` for the development workbench.
