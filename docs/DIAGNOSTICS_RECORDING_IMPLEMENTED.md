# Diagnostics & Recording 0.4 — Implemented

## Goal

Version 0.4 makes saved Overwolf GEP traffic inspectable before it is trusted by the live assistant.

```text
GEP JSONL envelope
       ↓
validation + feature observation
       ↓
raw payload inspection
       ↓
raw → canonical mapping journal
       ↓
GameEventPipeline replay
       ↓
feature health + issues + final decision report
```

The Overwolf adapter remains a thin source. It already writes one envelope per JSONL line; the new diagnostics layer consumes that format without depending on Electron or Overwolf.

## Core modules

### `gep-normalizer.mjs`

The normalizer now handles every event inside a multi-event GEP envelope. The previous single-event helper remains available, while the new APIs are:

- `inspectRawGameEvents(raw)`;
- `inspectInfoUpdates(raw)`;
- `toCanonicalGameEvents(raw)`;
- `toCanonicalInfoEvents(raw)`.

Inspection records preserve the raw event name, source feature, canonical result and a reason when no mapping exists.

### `gep-diagnostics.mjs`

`GepDiagnosticSession` validates envelopes and maintains:

- envelope counts by type;
- canonical and ignored mapping counts;
- raw → canonical mapping records;
- feature activity with `ACTIVE`, `STALE` and `UNSEEN` states;
- unexpected features not present in the requested feature set;
- timestamp gaps and out-of-order receipt warnings;
- GEP status warnings;
- pipeline normalization warnings;
- the final `GameState`, macro decision and decision history.

`GepFeatureHealthTracker` can also be used separately for live health indicators.

### `recording.mjs`

Pure browser/Node-compatible JSONL helpers:

- `parseJsonl(text)` keeps valid lines and reports malformed lines without aborting the whole import;
- `serializeJsonl(records)` creates recording text;
- `diagnoseJsonlRecording(text)` replays all valid envelopes and merges parser errors into one diagnostics report.

## CLI

Run the bundled recording:

```bash
npm run diagnose
```

Run a real recording:

```bash
npm run diagnose -- path/to/match.jsonl
```

Generate machine-readable output:

```bash
npm run diagnose -- path/to/match.jsonl --json
npm run diagnose -- path/to/match.jsonl --report diagnostics-report.json
```

The CLI reports parsing quality, envelope types, mappings, feature health, delivery gaps, unknown payloads and the final macro state.

## Diagnostics viewer

Start the existing local server:

```bash
npm run mock
```

Open:

```text
http://127.0.0.1:4173/diagnostics
```

The standalone viewer can:

- import a local `.jsonl` file;
- load the bundled sample recording;
- filter feature-health states;
- search and filter raw → canonical mappings;
- inspect gaps, unmapped payloads, parser failures and pipeline warnings;
- inspect the final pipeline state and decision history;
- export the complete report as JSON.

This viewer uses plain browser modules. No React/Tailwind migration or Mock Dashboard redesign was performed.

## Sample recording

`fixtures/recordings/sample-gep-session.jsonl` contains status, info updates, a multi-event game envelope, an unknown event, a deliberate delivery gap, an item acquisition and a recovered GEP warning.

It is intended to prove that diagnostics expose both valid state changes and transport/mapping problems in one deterministic report.

## Verification

Version 0.4 adds tests for:

- mapping every event in one raw envelope;
- feature states and unexpected features;
- unknown payload reporting;
- envelope gap detection;
- resilient JSONL parsing;
- JSONL serialization round trips;
- deterministic replay of the bundled GEP recording.

Commands:

```bash
npm test
npm run check
npm run replay
npm run diagnose
```
