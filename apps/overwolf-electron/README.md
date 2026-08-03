# Overwolf Electron adapter — local dev mode

The Electron shell owns one Live Bridge, one overlay window and one real-match capture recorder.

## Requirements

- Windows.
- Node.js 20 or newer.
- PowerShell opened as Administrator.
- Approved Overwolf developer account.
- `OW_CLI_EMAIL` plus `OW_CLI_API_KEY`, or a temporary `OW_DEV_KEY`.
- Dota 2 Steam launch options include `-gamestateintegration`.

Never commit developer credentials. Set them only in the PowerShell session used to launch Dota Flow.

```powershell
$env:OW_CLI_EMAIL = 'your-overwolf-email@example.com'
$env:OW_CLI_API_KEY = 'your-api-key'
```

## First local launch

Install the Overwolf Electron dependencies once from the repository root:

```powershell
npm run overwolf:install
```

Then use one elevated PowerShell session with the credentials set and run:

```powershell
npm run overwolf:dev
```

The one-console launcher:

1. validates Windows, credentials and gaming-package configuration;
2. builds the browser dashboard and Overwolf Electron main process;
3. starts the dashboard server;
4. waits until `http://127.0.0.1:4173/live` is reachable;
5. starts Overwolf Electron only after the renderer is ready;
6. stops both process trees when the app closes or `Ctrl+C` is pressed.

The Overwolf start command uses the QA gaming-package channel required for local Dota 2 GEP development and opens a remote debugging endpoint on port `9222`.

The individual commands remain available for diagnostics:

```powershell
npm run overwolf:preflight
npm run build
npm run overwolf:build
npm run overwolf:start
```

## Current GEP flow

- listen for `game-detected` and call `event.enable()`;
- query supported features with `getFeatures(gameId)`;
- call `setRequiredFeatures(gameId, features)`;
- subscribe to game events and info updates;
- request current info;
- emit explicit status envelopes for missing features, exit, privilege mismatch and errors.

The package enables Overwolf gaming packages `gep` and `overlay`. Recorder is intentionally not requested because Dota Flow records structured JSONL telemetry rather than video.

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
