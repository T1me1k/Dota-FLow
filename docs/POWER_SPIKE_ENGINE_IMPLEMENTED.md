# Power Spike Engine — Implemented through 0.10

## Core modules

- `packages/core/src/power-spike-engine.mjs`
- `packages/core/src/draft-analyzer.mjs`
- `packages/core/src/hero-catalog.mjs`
- `packages/core/src/hero-profiles.mjs`

## Current behavior

- complete 127-hero recognition and canonical Valve/GEP aliases;
- five detailed hero profiles with authored build plans and named item spikes;
- 122 conservative baseline profiles with generic level windows and no invented item targets;
- early/mid/late stage curves and seven power dimensions;
- build-plan target progression for detailed profiles;
- item and level acquisition history;
- matchup requirements and blockers;
- `OBJECTIVE` as a first-class macro action;
- profile tier and template in engine output;
- reduced confidence for baseline profiles.

Old `MISSED` spikes remain available in lifecycle history, but only recently missed windows can set the current global Power Spike status to `MISSED`.

## Dashboard

- all 127 heroes are selectable;
- baseline entries are visibly marked;
- detailed profiles expose authored build plans and item targets;
- baseline profiles disable the item selector until calibration;
- power lifecycle, dimensions, blockers and active/fading/missed history remain visible.

## Test status

Run:

```bash
npm test
```

The current suite covers macro decisions, event normalization, replay, diagnostics, Live Bridge, decision overlay, real-match validation and complete-roster engine safety.
