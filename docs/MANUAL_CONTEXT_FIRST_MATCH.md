# Manual Context & First-Match Toolkit — v0.11

Dota GEP does not expose every strategic signal required by the Role Engine. Version 0.11 adds explicit, expiring manual confirmations instead of inferring hidden map information.

## Manual inputs

The Live Monitor can confirm:

- whether the current lane is pushed and who has priority;
- whether the intended route is safe;
- whether a Wisdom fight is expected;
- the rune currently stored in Bottle;
- a valuable top or bottom rotation target;
- carry threat;
- pull and stack availability.

Each input becomes a `manual-context` envelope. It is processed through the same diagnostic session as GEP traffic, recorded in `events.jsonl`, replayed deterministically, and marked `MANUAL` in role-context provenance.

Manual input never changes GEP connection health. A user click cannot turn `WAITING` or `STALE` into `LIVE`.

## Safe expiration

Manual signals use the existing role-context staleness rules. Lane and route confirmations expire quickly; Bottle and inventory-like confirmations last longer. When proof expires, dangerous role actions return to `PREPARE_*` or `HOLD_POSITION` fallbacks.

## Electron shortcuts

```text
Ctrl+Shift+1  Lane pushed
Ctrl+Shift+2  Lane not pushed
Ctrl+Shift+3  Route safe
Ctrl+Shift+4  Route unsafe
Ctrl+Shift+D  Bottle: Double Damage
Ctrl+Shift+W  Wisdom fight expected
Ctrl+Shift+0  Clear manual context
```

All commands are also available as buttons in `/live`. Shortcuts are deliberately confirmations only; they do not send input to Dota or control the hero.

## Preflight

Run from the project root:

```bash
npm run preflight
npm run preflight -- --json
```

The automated check verifies Node, project files, writable capture storage and Electron dependency presence. It cannot automatically verify the Steam launch option or Overwolf approval, so those remain explicit manual checks.

Before the first bot-lobby capture:

1. Add `-gamestateintegration` to Dota 2 launch options.
2. Install dependencies in `apps/overwolf-electron`.
3. Start Dota Flow before launching the test lobby.
4. Keep capture running through the full match and one second lobby.
5. Use manual confirmations only when the displayed fact is visible to the player.
6. Export the complete capture directory for validation.
