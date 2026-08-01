# Role Engine Foundation 0.10

## Goal

Dota Flow should eventually guide every position, not only a carry. Macro actions remain useful, but other roles need more specific instructions tied to lane state, map timers, runes, allies and enemy heroes.

## Implemented now

A separate `Role Engine` is evaluated after every canonical event. Pipeline snapshots include:

```js
{
  state,
  decision,
  roleDecision,
  decisionHistory,
  roleDecisionHistory
}
```

Supported roles:

- carry;
- mid;
- offlane;
- soft support / position 4;
- hard support / position 5.

The state contract now includes `role` and normalized `roleContext`. Updates can arrive through `ROLE_CONTEXT_UPDATED` without coupling role logic to Overwolf-specific payloads.

## Mid foundation

The engine evaluates:

- player net worth versus the enemy mid;
- whether the mid wave is shoved;
- lane priority before runes;
- bottled or active rune;
- side-lane kill potential and danger;
- readiness of the ultimate;
- upcoming Power and Wisdom Rune windows.

Implemented examples:

- shove before controlling a Power Rune;
- rotate only after preparing the wave;
- prefer the side lane with the best kill-potential/danger tradeoff;
- hold bottled Double Damage for an imminent Wisdom fight;
- move to Wisdom with DD, Haste or Invisibility when a contest is expected.

## Offlane foundation

The engine can prioritize:

- pressure on the enemy carry;
- tower conversion after a won lane;
- occupying dangerous space;
- connecting with a ready initiation cooldown;
- contesting the nearby Wisdom Rune;
- resetting instead of feeding while frontlining.

## Position 4 foundation

The engine can prioritize:

- helping the mid Power Rune;
- securing or contesting Wisdom;
- stacking during a valid time window;
- choosing the best side-lane gank;
- creating vision before a rotation;
- playing near the active core when no forced task exists.

## Position 5 foundation

The engine can prioritize:

- protecting a threatened carry above greedy map tasks;
- pulling a pushed lane when the carry is safe;
- stacking without abandoning the lane;
- taking Wisdom only after preparing carry safety;
- placing safe vision around the carry and next objective.

## Timed objective schedule

The current configurable timing model contains:

- Water Runes: 2:00 and 4:00;
- Power Runes: first at 6:00, then every 2:00;
- Wisdom Runes: first at 7:00, then every 7:00;
- stack window: seconds 50–56 of each minute.

The role engine must never use the clock alone. A timer creates an opportunity; lane priority, danger, resources and team readiness decide whether moving is correct.

## Role Context Adapter in v0.10

The engine now receives capability-aware provenance metadata. Live own-player signals are mapped from GEP, roster role codes select the player position, dynamic fields become stale, and direct map actions are blocked when their required context is unavailable. See `ROLE_CONTEXT_ADAPTER_IMPLEMENTED.md`.

## Not available from the current live adapter

The project does not yet prove live sources for:

- exact relative net worth of lane opponents;
- real lane equilibrium and wave position;
- exact hero map positions;
- held Bottle rune state;
- ward and deward state;
- fog-of-war enemy visibility history;
- camp availability and pull geometry;
- exact ally cooldown readiness.

Those fields remain canonical inputs for simulation, manual confirmation and future trusted adapters. Version 0.10 already applies confidence-aware fallbacks; the next phase is validating them against real captures.

## Long-term role roadmap

1. Mid Lane Engine: runes, wave opportunity cost, gank target selection and return path.
2. Offlane Engine: enemy carry suppression, tower/area conversion and initiation readiness.
3. Support Economy Engine: pulls, stacks, Wisdom, ward routes and smoke timing.
4. Team Context Engine: ally ultimates, saves, initiators and global abilities.
5. Map Context Engine: lane pressure, missing enemies, safe routes and objective control.
6. Role-specific overlay wording and post-match review.
