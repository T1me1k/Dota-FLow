# Overwolf Electron adapter — local dev mode

The Electron shell owns one Live Bridge, one overlay window and one real-match capture recorder.

## Requirements

- Windows.
- Node.js 22.12.0 or newer for the pinned build toolchain.
- PowerShell running at the same privilege level as Dota 2. Use normal non-admin PowerShell when Steam and Dota run normally.
- Approved Overwolf developer account.
- Either `OW_CLI_EMAIL` plus `OW_CLI_API_KEY`, or an approved developer key in `OW_DEV_KEY`.
- Dota 2 Steam launch options include `-gamestateintegration`.

Never commit developer credentials. Set them only in the PowerShell session used to launch Dota Flow.

For a Console API key:

```powershell
$env:OW_CLI_EMAIL = 'your-overwolf-email@example.com'
$env:OW_CLI_API_KEY = 'your-api-key'
```

For a developer key created from the approval/profile page, remove Console variables and set only:

```powershell
Remove-Item Env:OW_CLI_EMAIL -ErrorAction SilentlyContinue
Remove-Item Env:OW_CLI_API_KEY -ErrorAction SilentlyContinue
$env:OW_DEV_KEY = 'your-developer-key'
```

Do not leave both credential modes set. The preflight rejects ambiguous credentials because the wrong mode can make the Overwolf package verification fail.

## First local launch

From the repository root, in the same PowerShell session:

```powershell
npm run overwolf:preflight
npm run overwolf:install
npm run overwolf:dev
```

`overwolf:dev` is the canonical launch command. It:

1. validates Node.js, credentials and the Windows platform;
2. builds the web renderer in `LIVE_GEP` mode;
3. cleans and compiles the Electron adapter;
4. verifies that the sandboxed preload is CommonJS-compatible;
5. starts the local renderer server and waits for `/live` to respond;
6. starts Overwolf Electron with the QA gaming-package channel;
7. owns both process trees so `Ctrl+C` closes the server and Electron.

Expected startup lines include:

```text
Overwolf build verified: sandbox-compatible preload.js created from preload.cjs.
Dashboard ready: http://127.0.0.1:4173/live
Starting Overwolf Electron.
```

## Startup failure behavior

The renderer includes a bootstrap guard. A preload, IPC or React startup failure must show a visible diagnostic message instead of a background-only window. The same failure should also appear in PowerShell.

Common states:

- `LIVE_GEP` + `initializing`: GEP listeners exist and Dota detection is pending.
- `waiting-for-game`: features registered, but current Dota info is not available yet.
- `connected`: initial game info was received.
- `PRIVILEGE_MISMATCH`: Dota and Dota Flow use different privilege levels.
- `OVERWOLF_RUNTIME_UNAVAILABLE`: authenticated gaming packages did not load.
- `GEP_ACTIVATION_FAILED`: feature registration failed after retries.

If startup stops before the Electron window opens, keep the full output beginning at `Dota Flow: starting one-console Overwolf dev mode.` Do not include credential commands or key values.

## Current GEP flow

- listen for `game-detected` and call `event.enable()`;
- query supported features with `getFeatures(gameId)`;
- retry `setRequiredFeatures(gameId, features)` on transient startup failures;
- subscribe to game events and info updates;
- request current info and distinguish registered/waiting/connected states;
- re-register after real game detection even if the app started first;
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
