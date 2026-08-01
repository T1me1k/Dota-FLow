# Dota Flow — Power Spike Engine Plan

## 1. Product goal

Power Spike Engine converts the current hero state into an explainable power model and feeds action biases into Macro Engine.

It must answer four questions:

1. How strong is this hero now in farm, fight, push, survival, initiation, objectives and mobility?
2. Is a named power spike approaching, active, fading or already missed?
3. Which conditions block the spike from being safely used?
4. Which macro action should receive additional weight because of the spike?

The engine is deterministic and local. It does not require a large language model or network request during a match.

## 2. Inputs

### Player state

- hero and role;
- game time and level;
- gold, GPM and target item progress;
- current inventory;
- item acquisition timestamps;
- level acquisition timestamps;
- HP and mana;
- ultimate readiness;
- alive/buyback state.

### Match context

- allied and enemy draft;
- visible opportunity such as an enemy core death;
- number of allies ready;
- Roshan availability;
- whether a safe route exists.

## 3. Output contract

`evaluatePowerState(state)` returns:

- hero identity and game stage;
- lifecycle status: `NONE`, `APPROACHING`, `ACTIVE`, `FADING`, `MISSED`;
- primary and next named spike;
- seven power dimensions from 0 to 100;
- macro action biases;
- blockers and requirements;
- draft summary and confidence.

## 4. Seven power dimensions

- `farm`: speed of economic acceleration;
- `fight`: direct combat impact;
- `push`: lane and building pressure;
- `survival`: ability to stay alive after committing;
- `initiation`: ability to reliably start an action;
- `objective`: Roshan and objective conversion;
- `mobility`: ability to enter, leave and move between actions.

## 5. Hero profile model

Each supported hero contains:

- archetypes;
- vulnerabilities;
- base power dimensions;
- early/mid/late stage curves;
- GPM and level benchmarks;
- one or more build plans;
- named power spikes.

A power spike contains:

- trigger conditions such as level or item ownership;
- expected acquisition minute;
- early and late tolerance;
- active and fading duration;
- permanent power effects;
- temporary window effects;
- macro action biases;
- requirements and recommendation text.

## 6. Lifecycle evaluation

### Approaching

A spike becomes approaching when:

- the player is within one level of a level spike; or
- the target item is close enough by remaining gold; or
- expected timing is near and progress is meaningful.

### Active

The trigger is satisfied and the configured active duration has not elapsed.

### Fading

The active duration ended, but part of the temporary advantage remains.

### Missed

The temporary advantage expired or the spike was acquired so late that its relative edge is heavily reduced.

Timing changes the effect multiplier:

- early: stronger than baseline;
- on time: normal;
- late: reduced;
- very late: strongly reduced.

## 7. Requirements and blockers

A trigger can be satisfied while the spike is not safely usable.

Examples:

- Blink is owned but the ultimate is unavailable;
- BKB timing exists but the hero has 25% HP;
- Phantom Assassin has Desolator but the enemy draft has heavy control and she lacks BKB;
- Sven has damage but the enemy draft can kite him.

Blocked spikes keep their permanent effects, but temporary fight/action bonuses are reduced.

## 8. Draft analysis

The draft analyzer assigns tags to known heroes and derives normalized matchup signals:

- enemy control, burst, kite, global reach, save and durability;
- allied initiation, control, save and push.

This is intentionally a replaceable seed implementation. Later versions should load patch-versioned hero tags and matchup coefficients from data files or the backend.

## 9. Macro Engine integration

Power Spike Engine does not make the final macro decision.

It supplies:

- action biases;
- dimension thresholds;
- named reasons;
- blockers;
- power confidence.

Macro Engine combines these with economy, HP/mana, GPM benchmark, enemy deaths, allies ready and map safety.

## 10. Initial supported heroes

- Luna;
- Juggernaut;
- Sven;
- Ursa;
- Phantom Assassin.

They represent different archetypes and validate that identical events produce different decisions.

## 11. Validation scenarios

Automated tests cover:

- Luna Manta favoring farm/pressure;
- Ursa Blink favoring fight/objective;
- PA Desolator being blocked by heavy control without BKB;
- early timing being stronger than late timing;
- approaching item exposing the next named spike;
- Macro Engine consuming hero-specific power bias.

## 12. Next calibration phase

The current values are seed coefficients, not final patch truth.

Calibration requires:

1. versioned item and hero data;
2. expected timing distributions by hero, rank, role and patch;
3. replay-derived acquisition timestamps;
4. expert review of spike definitions;
5. user feedback on incorrect or late calls;
6. offline evaluation against recorded matches.

The architecture is designed so coefficients can change without rewriting the engine.
