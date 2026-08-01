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
