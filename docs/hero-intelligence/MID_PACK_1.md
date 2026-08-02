# Mid Intelligence Pack 1

This calibration batch adds detailed hero profiles for:

- Ember Spirit
- Invoker
- Lina
- Puck
- Queen of Pain
- Storm Spirit
- Void Spirit
- Zeus

Each profile includes:

- hero-specific base power and stage curves;
- at least two concrete build plans;
- at least three named level or item power spikes;
- action bias for farm, connect, fight, pressure, and objectives;
- vulnerabilities and explicit player-facing recommendations;
- regression coverage for profile completeness and spike activation.

## Lifecycle regression discovered during calibration

The Puck objective replay exposed that an emergency macro `RESET` could remain pinned after respawn even when health, mana, gold, and route safety had recovered. The stable decision coordinator now releases that stale emergency state immediately instead of waiting for an unrelated large score margin.

The Invoker safety replay keeps critical resources and objective readiness explicit. Its checkpoint now verifies the precise `RESET_BEFORE_OBJECTIVE` safety call and the `HEALTH_IS_CRITICALLY_LOW_15` reason code rather than accepting a generic reset label.

## Calibration boundary

The values in this pack are prototype coaching calibration, not a claim of universal patch-perfect item timing. Live recordings and balance-patch review remain required before release calibration is considered final.

Detailed profile coverage after this batch: **40 / 127 heroes**.
