# Hero Intelligence Completion Plan

## Coverage audit

The code audit confirmed the starting state at **127 total / 48 detailed / 79 baseline**. The canonical registry now reports **127 detailed / 0 baseline**.

### Initially detailed (48)

Alchemist, Anti-Mage, Arc Warden, Bloodseeker, Chaos Knight, Clinkz, Dawnbreaker, Death Prophet, Dragon Knight, Drow Ranger, Ember Spirit, Faceless Void, Gyrocopter, Invoker, Juggernaut, Kunkka, Leshrac, Lifestealer, Lina, Luna, Marci, Medusa, Monkey King, Morphling, Muerta, Naga Siren, Necrophos, Outworld Destroyer, Pangolier, Phantom Assassin, Phantom Lancer, Primal Beast, Puck, Queen of Pain, Razor, Slark, Spectre, Storm Spirit, Sven, Templar Assassin, Terrorblade, Tiny, Troll Warlord, Ursa, Void Spirit, Weaver, Wraith King, Zeus.

### Initially baseline / completed in this change (79)

Abaddon, Ancient Apparition, Axe, Bane, Batrider, Beastmaster, Bounty Hunter, Brewmaster, Bristleback, Broodmother, Centaur Warrunner, Chen, Clockwerk, Crystal Maiden, Dark Seer, Dark Willow, Dazzle, Disruptor, Doom, Earth Spirit, Earthshaker, Elder Titan, Enchantress, Enigma, Grimstroke, Hoodwink, Huskar, Io, Jakiro, Keeper of the Light, Kez, Largo, Legion Commander, Lich, Lion, Lone Druid, Lycan, Magnus, Mars, Meepo, Mirana, Nature's Prophet, Night Stalker, Nyx Assassin, Ogre Magi, Omniknight, Oracle, Phoenix, Pudge, Pugna, Riki, Ringmaster, Rubick, Sand King, Shadow Demon, Shadow Fiend, Shadow Shaman, Silencer, Skywrath Mage, Slardar, Snapfire, Sniper, Spirit Breaker, Techies, Tidehunter, Timbersaw, Tinker, Treant Protector, Tusk, Underlord, Undying, Vengeful Spirit, Venomancer, Viper, Visage, Warlock, Windranger, Winter Wyvern, Witch Doctor.

## Package progress

| Registry package | Heroes | Status |
|---|---:|---|
| `builtin` | 5 | complete |
| `carry` | 27 | complete |
| `mid` | 16 | complete |
| `mid-tempo-core` | 8 | complete |
| `flex-core` | 6 | complete |
| `frontline-initiator` | 9 | complete |
| `macro-offlane` | 9 | complete |
| `roaming-support` | 10 | complete |
| `utility-support` | 8 | complete |
| `save-support` | 8 | complete |
| `control-support` | 8 | complete |
| `macro-support-a` | 7 | complete |
| `macro-support-b` | 6 | complete |

## Contract and test coverage

- Registered build plans: **460**.
- Registered power spikes: **508**.
- Registry synchronization, unique IDs, complete roster, detailed contracts, strategic uniqueness, macro execution and unknown-ID safety are automated.
- Adaptive selection emits scenario reason codes and missing-signal limitations.
- Existing deterministic replay suite remains the lifecycle regression gate.

## Calibration status

New profiles use centralized `prototype-7.38-strategy-v1` metadata, confidence capped at 0.72, `patchReviewRequired: true`, and patch label `7.38-review-required`. Timings are strategic prototypes until verified against live recordings. Kez, Largo, and Ringmaster deliberately use repository-supported role signals without unverified ability claims.

## Remaining risks

- All 79 new profiles require live-match timing calibration; prototype confidence must not be promoted without recordings.
- Patch review is required after balance or item changes.
- Draft signals cannot distinguish every damage source; incomplete drafts reduce advisor confidence.
- Legacy 48 profiles retain their prior calibration schema and should be migrated to centralized metadata in a future calibration-only pass.
