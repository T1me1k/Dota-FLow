# Full Hero Roster — Updated through 0.10

## Goal

Dota Flow previously contained five hero-specific profiles. Version 0.8 makes the complete project roster available to the live pipeline without pretending that every hero has already been calibrated.

Roster snapshot date: **2026-08-01**. Catalog size: **127 heroes**.

## Profile tiers

### DETAILED

The detailed tier now contains 32 authored carry/core profiles. The original five remain fully authored:

- Luna;
- Juggernaut;
- Sven;
- Ursa;
- Phantom Assassin.

They contain hero-specific build plans, item and level spikes, expected timing windows, blockers and action biases.

### BASELINE

The other 95 heroes receive conservative profiles generated from one of seven broad templates:

- hard carry;
- tempo core;
- caster core;
- pusher;
- durable core;
- initiator;
- support.

Baseline profiles contain role metadata, draft tags, stage curves, broad GPM/level benchmarks and generic level 6/12/18 windows. Their confidence is reduced and capped by the Macro Decision Engine.

They intentionally contain an empty `baseline_manual` build plan. The UI therefore shows no automatic target item and the Power Spike Engine cannot fabricate an item timing for an uncalibrated hero.

## Canonical hero IDs

`hero-catalog.mjs` is the single catalog and alias boundary. It accepts public IDs, display names and known Valve/GEP names such as:

```text
npc_dota_hero_antimage           → anti_mage
npc_dota_hero_nevermore          → shadow_fiend
npc_dota_hero_furion             → natures_prophet
npc_dota_hero_zuus               → zeus
npc_dota_hero_windrunner         → windranger
npc_dota_hero_skeleton_king      → wraith_king
npc_dota_hero_obsidian_destroyer → outworld_destroyer
```

The normalizer stores only canonical IDs. Draft sides use the same resolution path.

## Engine behavior

Power Spike output now includes:

- `calibrationTier`;
- `profileTemplate`;
- catalog roles.

Macro Decision output includes matching profile metadata. Detailed profile confidence is 0.96 before state/data modifiers. Baseline profile confidence is 0.62 and final macro confidence is capped at 0.74.

The Decision Overlay marks baseline calls as `BASELINE PROFILE`, shows `BUILD: NOT CALIBRATED`, and the Live Monitor includes the tier beside confidence.

## Dashboard behavior

The Mock Dashboard lists every catalog hero. Baseline entries carry a `· baseline` marker. Their item selector is disabled with a calibration message; detailed profiles keep their authored build plans.

No React/Tailwind migration was made in this release.

## Tests

The roster tests verify:

- exactly 127 unique IDs and display names;
- presence of Ringmaster, Kez and Largo;
- exactly 32 detailed and 95 baseline profiles;
- Valve/GEP alias resolution;
- full profile contract for every hero;
- successful macro evaluation for every hero without Luna fallback;
- no invented baseline target item;
- canonical state normalization;
- clean match start for a baseline hero.

## Carry profile expansion

Version 0.9 promotes 27 additional carry/flexible-core heroes to `DETAILED`. See `CARRY_PROFILE_PACK_IMPLEMENTED.md`. Remaining baseline heroes stay intentionally conservative until their role-specific logic and live data requirements are reviewed.
