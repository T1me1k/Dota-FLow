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

From the repository root, in the same elevated PowerShell session:

```powershell
npm run overwolf:preflight
npm run overwolf:install
npm run build
npm run mock
```

Leave the mock dashboard running. Open a second elevated PowerShell in the repository root, set the same environment variables there, then run:

```powershell
npm run overwolf:build
npm run overwolf:start
```

The start command uses the Overwolf QA gaming-package channel required for local Dota 2 GEP development and opens a remote debugging endpoint on port `9222`.

For later launches, after dependencies are installed and the browser dashboard is running:

```powershell
npm run overwolf:dev
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
