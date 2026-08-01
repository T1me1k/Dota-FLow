# Content & Balance System — implemented

Implemented in Dota Flow 0.20.0 as a deterministic, framework-independent core feature.

## Implemented

- Patch metadata, item tags, objective timings, validators, coverage reporting and deterministic saved-data migrations.\n- Current profile content remains prototype-calibrated; warnings are reported rather than silently accepted.

Every recommendation includes confidence, reasons, warnings, blockers, missing signals, provenance/data quality, and generation time. Dangerous calls fall back to a safer action when required context is missing or stale. The canonical pipeline and deterministic CLI simulators expose the feature for replay-first development.

## Data boundary

- **LIVE** means only an observed permitted GEP signal.
- **MANUAL** means a player confirmation about visible information.
- **INFERRED** means a conservative derivation and is never relabelled LIVE.
- **STALE/UNAVAILABLE** blocks unsafe direct calls.
- Fixtures and browser demonstrations are simulated, not evidence of production telemetry.

No Windows or real Overwolf runtime validation was performed in this environment. The adapter remains a thin transport; production whitelisting, payload validation, performance testing, packaging, signing, and installer work are deferred.
