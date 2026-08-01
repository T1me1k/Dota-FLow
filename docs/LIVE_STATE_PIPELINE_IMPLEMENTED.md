# Live State Pipeline 0.3 — Implemented

## Goal

Version 0.3 creates one deterministic path for every state change, whether the source is the Mock Dashboard, a replay fixture or the future Overwolf GEP adapter.

```text
raw source → canonical event → reducer → normalized state → decision stack → history
```

## Added modules

### `game-events.mjs`

Defines the supported canonical event types, event helpers and item-ID normalization. Source adapters should translate their payloads into this contract instead of mutating state directly.

### `event-reducer.mjs`

Implements `applyGameEvent(state, event)`. It handles match lifecycle, snapshots, time, levels, items, economy, vitals, death/respawn, ultimate state, context, draft and identity events.

`ITEM_ADDED` records acquisition time and uses the active hero build plan to select the next unowned target item.

### `game-state-normalizer.mjs`

Normalizes every reducer result. It protects the engine from:

- malformed or missing values;
- negative gold, health and economy values;
- duplicate inventory entries;
- unknown heroes and items;
- backward hero levels;
- out-of-order game time;
- temporarily missing snapshot fields;
- unsafe context values.

Late events are retained when useful, but their effective time is clamped to the current match clock so progression timestamps remain monotonic.

Warnings are stored in `state.diagnostics.warnings` instead of throwing and breaking the live pipeline.

### `live-pipeline.mjs`

`GameEventPipeline` owns the current state, stable decision coordinator, current decision, event count and decision history.

After every dispatch it:

1. applies the canonical event;
2. normalizes the result;
3. recalculates Power Spike and Macro Decision outputs;
4. records a history entry when the macro action changes.

A history entry contains:

```js
{
  gameTimeSec: 920,
  previousAction: 'FARM',
  action: 'RESET',
  confidence: 0.98,
  reasons: ['Низкий запас здоровья'],
  triggerEventType: 'GAME_SNAPSHOT',
  powerStatus: 'ACTIVE'
}
```

Starting a new match resets per-match decision history, stabilization state and event count.

### `replay-simulator.mjs` and `scripts/replay.mjs`

JSON fixtures can replay full event sequences without Dota 2. The simulator returns the final state, final decision, per-event timeline and action-change history. The CLI prints a readable timeline.

Bundled fixtures:

- `luna-standard-game.json`;
- `phantom-assassin-fast-desolator.json`;
- `phantom-assassin-slow-battlefury.json`.

## Mock Dashboard integration

The dashboard now owns a `GameEventPipeline`. Start, clock ticks, item purchases, level changes, danger states and opportunities are all dispatched as canonical events. It uses the same interface intended for replay and Overwolf sources.

No React/Tailwind migration or visual redesign was performed.

## Overwolf boundary

The Overwolf adapter remains an external source and was not modified for this milestone. Existing `gep-normalizer.mjs` maps known raw GEP shapes into canonical events or reducer calls. Live integration should eventually dispatch those canonical events into one persistent `GameEventPipeline` instance.

## Verification

The complete suite contains 22 passing tests. New coverage includes:

- canonical item events and build-plan progression;
- malformed and partial events;
- stale time and backward level protection;
- unknown IDs and duplicate inventory entries;
- macro decision-history transitions;
- new-match history reset;
- monotonic timestamps for late item events;
- deterministic JSON replay output;
- all existing Power Spike and Macro Decision behavior.

Commands:

```bash
npm test
npm run check
npm run replay
```
