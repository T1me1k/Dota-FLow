# Dota Flow 0.7 — Real Match Validation

Version 0.7 turns raw GEP recordings into an explicit engineering gate before decision calibration.

## Validation gate

`validateJsonlRecording()` checks:

- JSONL and envelope integrity;
- successful runtime feature registration with no missing required features;
- monotonic transport timestamps;
- match and local-player identity;
- playing phase and match end;
- clock progression;
- repeated gold plus GPM;
- hero levels and complete health/mana payloads;
- inventory changes;
- required raw payloads mapping to canonical events;
- second-match identity for the release profile.

The report contains PASS/FAIL signals, blockers, inferred payload contracts and calibration points.

## Payload contracts

For every observed feature the validator records:

- game-event vs info-update delivery;
- raw and parsed value kinds;
- stringified JSON frequency;
- observed object keys and value types;
- null/reset-like payloads;
- average/min/max delivery interval;
- compact examples.

This is intended to reveal actual production payloads instead of assuming documentation examples are exact.

## Capture sessions

The Electron main process automatically starts a per-run capture under its user-data `recordings` directory. Every capture folder contains:

```text
events.jsonl
manifest.json
validation-report.json
```

The Live Monitor can start/stop a capture and open the recordings folder. Stopping a capture writes a release-profile validation report. The recorder creates `events.jsonl` immediately and Electron waits for the pending write queue and final report before quitting.

## GEP adapter hardening

The adapter now:

- listens for `game-detected` and calls `enable()`;
- registers features with `setRequiredFeatures(gameId, features)`;
- queries `getFeatures(gameId)` before registration;
- reports supported and missing features;
- handles game exit, elevated privileges and GEP errors;
- attempts startup activation when Dota was already running.

## Commands

```bash
npm run validate:match
npm run validate:match -- --release
npm run validate:match -- path/to/events.jsonl --strict
npm run validate:suite -- path/to/recordings-directory
```

The suite gate requires five passing recordings and at least one verified cross-match reset. It recursively discovers `events.jsonl` files inside Electron capture folders.

## Browser viewer

Run `npm run mock` and open:

```text
http://127.0.0.1:4173/validation
```

## Known real-test gate

Inventory progression is mandatory for item timing and power-spike coaching. If `hero_item_changed` is missing or unavailable in the approved runtime, v0.7 correctly blocks calibration. A compliant replacement data source must be designed before live item-based recommendations are enabled.
