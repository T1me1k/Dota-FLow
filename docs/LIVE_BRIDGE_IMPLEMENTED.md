# Live Bridge 0.5 — Implemented

## Goal

Version 0.5 connects incoming Overwolf GEP envelopes to one persistent runtime session instead of making each renderer interpret raw events independently.

```text
Overwolf GEP adapter
        ↓ raw envelope + sourceSequence
JSONL recording       LiveGepBridge
                           ↓
              transport deduplication
                           ↓
            persistent GepDiagnosticSession
                           ↓
                  GameEventPipeline
                           ↓
         normalized state + macro decision
                           ↓
         desktop IPC + overlay IPC snapshots
```

The adapter remains a thin source. Product state, diagnostics, session lifecycle and decisions live in the runtime-independent core package.

## Core module

### `live-gep-bridge.mjs`

`LiveGepBridge` owns one active `GepDiagnosticSession` and exposes:

- `ingestEnvelope(envelope)`;
- `ingestMany(envelopes)`;
- `snapshot(now)`;
- `subscribe(listener)`;
- `reset(options)`;
- `stop(reason)`.

Every accepted raw envelope is forwarded once into diagnostics and the canonical pipeline. The resulting snapshot contains:

- bridge connection state and counters;
- current session identity;
- current diagnostics report;
- normalized `GameState`;
- current macro decision and history;
- compact archives of previous match sessions;
- bridge lifecycle events.

## Connection states

The bridge reports:

- `WAITING` — no GEP envelope has arrived yet;
- `LIVE` — valid traffic is arriving;
- `DEGRADED` — GEP emitted a warning/error or an invalid envelope was received;
- `UNAVAILABLE` — the Overwolf runtime is not available and the adapter entered mock mode;
- `STALE` — no accepted envelope arrived before the configured timeout;
- `STOPPED` — the bridge was explicitly stopped.

A healthy game/info envelope recovers a degraded connection back to `LIVE`.

## Transport deduplication

The adapter now adds a monotonic `sourceSequence` to each envelope. The bridge uses an explicit source identity when available, otherwise it falls back to a stable envelope fingerprint.

Fallback fingerprints are retained for the configured window. Explicit adapter `sourceSequence` identities remain deduplicated until bounded cache eviction, so a delayed IPC replay cannot be applied twice. Duplicates:

- increment `duplicateEnvelopeCount`;
- create a `DUPLICATE_ENVELOPE` bridge event;
- are not written into the active diagnostics session;
- do not dispatch canonical events again;
- cannot duplicate item purchases, deaths or decision transitions.

This is transport deduplication, not semantic event collapsing. Two legitimate source events with different `sourceSequence` values are both processed even when their payloads are equal.

## Match-session rotation

When a new `MATCH_IDENTIFIED` canonical event contains a match ID different from the active match:

1. the current diagnostics/pipeline session is archived;
2. a clean `GepDiagnosticSession` is created;
3. fingerprint state is cleared;
4. the new match-identification envelope is processed in the new session.

Previously seen match IDs are remembered separately from the archive. A delayed identity envelope from an older match is dropped with `STALE_MATCH_IDENTITY` instead of rotating the bridge backward.

Archives retain a compact final state, decision, decision history, feature-health summary and issue count. The number of archives is bounded.

## Electron integration

`apps/overwolf-electron/src/main/main.ts` now creates exactly one bridge in the main process.

For every adapter envelope it:

1. appends the raw envelope to JSONL;
2. broadcasts raw traffic on `dota-flow:gep` for inspection;
3. ingests the envelope into `LiveGepBridge`;
4. broadcasts the resulting snapshot on `dota-flow:live-snapshot` to both desktop and overlay windows.

The preload API now exposes:

- `onGepEnvelope(listener)`;
- `onLiveSnapshot(listener)`;
- `getLiveSnapshot()`;
- `resetLiveSession()`;
- overlay show/hide methods.

The adapter requests `hero_item_changed`, matching the canonical item-acquisition mapping used by the Power Spike Engine and build-plan progression.

## Live simulator and monitor

Run the deterministic terminal simulation:

```bash
npm run live
```

Use another JSONL stream:

```bash
npm run live -- path/to/session.jsonl
npm run live -- path/to/session.jsonl --pace 250
npm run live -- path/to/session.jsonl --json
```

Start the local server and open the browser monitor:

```bash
npm run mock
```

```text
http://127.0.0.1:4173/live
```

In a normal browser the monitor streams the bundled fixture envelope by envelope. Inside the Electron renderer it consumes `dota-flow:live-snapshot` IPC messages instead.

The monitor displays connection state, counters, current macro action, normalized carry state, feature health, current issues, bridge lifecycle events and archived matches. It uses plain browser modules; the existing dashboard design was not migrated to React/Tailwind.

## Deterministic fixture

`fixtures/recordings/live-bridge-session.jsonl` includes:

- a connected Overwolf status;
- initial match/player/game snapshots;
- one transport duplicate;
- a reconnect warning and recovery;
- a second match ID that rotates the active session;
- a final Phantom Assassin economy snapshot.

Expected final result:

```text
12 received
11 forwarded
1 duplicate
1 archived match
active match live-match-b
hero phantom_assassin
connection LIVE
```

## Verification

Version 0.5 adds tests for:

- persistent envelope-to-pipeline forwarding;
- subscriber snapshots;
- duplicate suppression;
- dedupe-window expiration;
- connection state transitions and staleness;
- match-ID session rotation and archive contents;
- protection against late identity envelopes rotating back to an old match;
- stop/reset behavior;
- stable envelope fingerprints;
- deterministic replay of the bundled live stream.

Commands:

```bash
npm test
npm run check
npm run replay
npm run diagnose
npm run live
```
