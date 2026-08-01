# Decision Overlay implemented — Dota Flow 0.6

Version 0.6 adds the first decision-only in-game overlay driven exclusively by `dota-flow:live-snapshot`.

## Architecture

```text
LiveGepBridge snapshot
        ↓
DecisionOverlayController
        ↓
visibility + safety rules + presentation model
        ↓
plain browser renderer / Electron transparent window
```

The overlay renderer does not calculate macro actions. It only converts the existing bridge snapshot into a safe presentation model. The same model is used by tests, the terminal simulator, the browser preview and Electron.

## Core presentation model

`packages/core/src/decision-overlay.mjs` exports:

- `deriveDecisionOverlayModel(snapshot, options)`;
- `DecisionOverlayController`;
- action metadata and priorities;
- normalized overlay settings;
- overlay modes and view states.

Macro priorities are presentation priorities, not decision-engine scoring. `RESET` receives the strongest visual urgency, followed by `FIGHT`/`OBJECTIVE`, then `PRESSURE`, `CONNECT` and `FARM`.

## Safety and visibility rules

The overlay is hidden when:

- it is manually disabled;
- the bridge is `WAITING` or `STOPPED`;
- Overwolf GEP is unavailable and the safe default is enabled;
- no active match is detected;
- confidence is below the configured threshold and low-confidence hiding is enabled.

A `STALE` bridge does not continue presenting the last decision as current. It replaces it with a visible **ДАННЫЕ УСТАРЕЛИ** warning unless `showStaleDecision` is explicitly enabled.

A `DEGRADED` connection may keep the latest decision visible, but the overlay clearly marks it as a degraded live call.

The controller detects action changes and exposes a short pulse state. First actions and first actions after match rotation do not produce a false change pulse.

## Overlay content

Compact mode shows:

- macro action;
- confidence;
- one primary reason;
- game clock;
- hero;
- power-spike status;
- target item and remaining gold.

Expanded mode allows more reasons and a wider card. Both modes use the same model.

## Browser preview

Run:

```bash
npm run mock
```

Open:

```text
http://127.0.0.1:4173/overlay
```

The browser preview automatically replays the bundled live recording. The Live Monitor exposes compact/expanded and low-confidence settings and can open the preview window.

## Electron integration

The Electron main process creates a transparent, frameless, non-focusable, click-through, always-on-top window centered near the top of the primary display.

Local development defaults:

```text
DOTA_FLOW_RENDERER_URL=http://127.0.0.1:4173/live
DOTA_FLOW_OVERLAY_URL=http://127.0.0.1:4173/overlay
```

Approved packaged builds can override both URLs with bundled renderer assets.

Overlay settings are persisted in `overlay-settings.json` under Electron `userData` and distributed through IPC:

```ts
window.dotaFlow.onOverlaySettings(listener)
window.dotaFlow.getOverlaySettings()
window.dotaFlow.setOverlaySettings(patch)
```

The renderer automatically calls `showOverlay()` or `hideOverlay()` when its safe visibility model changes.

## Simulation

Run:

```bash
npm run overlay
```

Use another recording:

```bash
npm run overlay -- path/to/recording.jsonl
npm run overlay -- path/to/recording.jsonl --json
```

The bundled stream demonstrates hidden pre-match state, a live `FARM` call, degraded connection presentation, recovery, match rotation and the final active decision.

## Verification

Version 0.6 tests cover:

- hidden waiting and post-match states;
- compact reason limits;
- target-item remaining gold;
- `RESET` urgency;
- stale-signal replacement;
- low-confidence presentation and hiding;
- degraded presentation;
- real action-change pulses;
- no false pulse after match rotation;
- deterministic fixture-to-overlay integration.
