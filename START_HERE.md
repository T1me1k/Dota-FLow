# Start here — Dota Flow 0.20

## Verify

Run `npm test`, `npm run check`, then the replay/simulator/content commands listed in `README.md`. Development is simulator-first: add canonical events or JSONL fixtures, replay them deterministically, assert quality-aware decisions, and only then validate permitted telemetry on Windows.

## Product surfaces

- Legacy local suite: `npm run mock` → `/coach`, `/live`, `/overlay`, `/diagnostics`, `/validation`.
- Desktop source: `npm run desktop:dev` → Home, Pre-game, Live Match, Match Review, Progress, Heroes, Hero Profile, Build Plans, Recordings, Diagnostics, Validation and Settings.
- Review CLI: `npm run review`; lane/objective/personal coach simulators have matching scripts.

## Safety and production boundary

Manual context may describe only information already visible to the player. It expires and never becomes LIVE. Missing or stale lane/objective evidence blocks dangerous calls. Dota Flow does not read memory, reveal fog information, press keys, purchase items or automate gameplay.

The Linux checks do not validate actual GEP or overlay behavior. Before release, use an approved Windows Overwolf Electron environment, validate payload capabilities across multiple bot-lobby captures, measure overlay/performance, then complete packaging, signing, privacy review and installer work.

## v0.20.1 integration entry points

Read `docs/V020_INTEGRATION_AUDIT.md`, `docs/V020_TEST_COVERAGE.md`, and `docs/RUNTIME_PROVIDER_CONTRACT.md` before changing the pipeline. Role v2 is primary. Mock/replay providers are supported; Electron IPC and Windows/Overwolf remain prepared but unconnected.

## v0.21 entry point

Start with `docs/DECISION_ORCHESTRATOR_IMPLEMENTED.md`, then run `npm test` and `npm run scenarios`. Live Match consumes a single coach call; raw engine outputs are diagnostics only.
