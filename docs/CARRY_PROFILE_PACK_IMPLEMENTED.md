# Carry Profile Pack 0.9 — Implemented

## Scope

Version 0.9 promotes 27 additional carry/flexible-core heroes from `BASELINE` to `DETAILED`, producing 32 detailed profiles in total and leaving 95 conservative baseline profiles.

## Newly detailed heroes

Anti-Mage, Drow Ranger, Faceless Void, Medusa, Morphling, Naga Siren, Phantom Lancer, Slark, Spectre, Terrorblade, Lifestealer, Wraith King, Chaos Knight, Gyrocopter, Bloodseeker, Arc Warden, Clinkz, Muerta, Razor, Weaver, Troll Warlord, Monkey King, Alchemist, Tiny, Marci, Dawnbreaker and Dragon Knight.

## Contract

Every detailed profile contains:

- at least two authored build plans;
- at least three named power spikes;
- an expected timing window;
- permanent power-dimension changes;
- temporary action biases;
- a hero-specific recommendation;
- vulnerabilities and archetype metadata.

The original five detailed profiles retain their existing hand-authored implementation. New profiles are generated from compact hero-specific configurations in `carry-profile-pack.mjs` while preserving distinct builds, spike names and decisions.

## Calibration boundary

New profiles use `balanceCalibration: prototype_v0_9`. This means the strategic structure is authored, but item costs and expected minute values must be reviewed after:

1. the active patch is chosen;
2. real inventory capture is reliable;
3. several representative matches are recorded;
4. expert review confirms each spike and build branch.

Baseline heroes still have an empty `baseline_manual` build plan and cannot fabricate target items.
