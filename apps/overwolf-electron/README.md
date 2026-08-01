# Overwolf Electron adapter — v0.7

The Electron shell owns one Live Bridge, one overlay window and one real-match capture recorder.

## Current GEP flow

- listen for `game-detected` and call `event.enable()`;
- query supported features with `getFeatures(gameId)`;
- call `setRequiredFeatures(gameId, features)`;
- subscribe to game events and info updates;
- request current info;
- emit explicit status envelopes for missing features, exit, privilege mismatch and errors.

## Capture files

Each run creates a folder under Electron `userData/recordings` containing:

```text
events.jsonl
manifest.json
validation-report.json
```

The preload exposes capture status/start/stop/open-folder methods in addition to live snapshot and overlay APIs. Capture writes are flushed and the final validation report is completed before application exit.

Dota 2 must be started with `-gamestateintegration`. See `../../docs/FIRST_LIVE_TEST.md` and `../../docs/REAL_MATCH_VALIDATION_IMPLEMENTED.md`.


## Manual context shortcuts

When the Overwolf runtime is active, Dota Flow registers confirmation-only global shortcuts:

```text
Ctrl+Shift+1  lane pushed
Ctrl+Shift+2  lane not pushed
Ctrl+Shift+3  route safe
Ctrl+Shift+4  route unsafe
Ctrl+Shift+D  Bottle Double Damage
Ctrl+Shift+W  Wisdom fight expected
Ctrl+Shift+0  clear manual context
```

The shortcuts update Dota Flow and the capture recording only. They never send keyboard input or commands to Dota 2.
