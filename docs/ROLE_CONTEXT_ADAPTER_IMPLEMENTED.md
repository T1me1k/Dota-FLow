# Role Context Adapter implemented — v0.10

## Purpose

The Role Engine can only recommend a rotation, rune contest, pull, stack or ward route when the required context is trustworthy. Version 0.10 introduces an explicit provenance and availability layer between raw GEP telemetry and role decisions.

## Signal states

Every role-context signal is tracked as one of:

- `LIVE` — received directly from the active runtime;
- `MANUAL` — explicitly supplied by the dashboard, operator or a future trusted integration;
- `INFERRED` — derived conservatively from known local data;
- `STALE` — previously available but too old for the action;
- `UNAVAILABLE` — the active capability set does not expose it;
- `UNKNOWN` — not observed yet.

The aggregate context quality is `FULL`, `PARTIAL`, `LIMITED` or `STALE`. Role confidence is capped by that quality.

## Live mappings

The adapter maps supported Dota GEP traffic into canonical state:

- player identity from `me` / `game_state_changed`;
- role and roster from `roster` role codes;
- game clock from `clock_time_changed`;
- own economy from `gold`, `gpm` and `xpm`;
- own level and vitals;
- ability level/use/cooldown state;
- last hits and denies from `cs`;
- observer-ward purchase cooldown;
- damage and team score diagnostics when emitted.

The Electron adapter now requests these features and reports requested, supported and missing capabilities into the same session.

## Explicitly unavailable context

The adapter does not invent:

- lane-wave position or lane priority;
- enemy or lane-opponent net worth;
- hero coordinates and fog-of-war positions;
- Bottle rune contents;
- pull/stack camp availability;
- safe pathing and route danger;
- ally readiness and exact cooldown plans;
- carry threat or ward/deward state.

These remain canonical fields that can later be supplied by a trusted adapter, manual confirmation or a validated inference model.

## Safety gate

Each dangerous role action declares required signals. Missing or stale requirements trigger a safe fallback:

- `CONTROL_POWER_RUNE` / unverified rune shove → `PREPARE_POWER_RUNE`;
- `MOVE_TO_WISDOM` → `PREPARE_WISDOM`;
- unverified rotate, gank, pull, stack, pressure or vision route → `HOLD_POSITION`.

The fallback preserves the known timer and explains the missing signals instead of pretending the map state is known.

## Match lifecycle

Capability limitations survive a new-match reset. Transient live/manual signals are reset, while known missing features such as unsupported inventory remain unavailable until a new capability status says otherwise.

## Tools

```bash
npm run role-context
npm run role-context -- path/to/capture/events.jsonl
npm run role-context -- --json
```

The built-in fixture models a mid player at 5:45 with live clock/economy/vitals/level/ability/CS/roster data but no lane state. The result is `PREPARE_POWER_RUNE`, not a fabricated rotation or shove.

The Live Monitor now shows context quality, live coverage, per-signal provenance and data limitations beside the role task.
