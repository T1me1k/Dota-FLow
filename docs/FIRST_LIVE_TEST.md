# First real-match test checklist

## Environment

- [ ] Approved Overwolf Electron development environment is installed.
- [ ] Dota 2 Steam launch options include `-gamestateintegration`.
- [ ] Dota Flow and Dota 2 run at matching privilege levels.
- [ ] `npm run mock` serves `/live`, `/overlay` and `/validation`.
- [ ] Live Monitor shows capture state `RECORDING`.
- [ ] GEP status lists requested, supported and missing features.

## First lobby

Use Luna in a local bot lobby.

- [ ] Main menu and lobby are recorded.
- [ ] Hero selection and strategy time are recorded.
- [ ] Negative pregame clock is recorded.
- [ ] Playing phase and clock progression are recorded.
- [ ] Gold, GPM, XPM, level, health and mana change.
- [ ] At least one inventory change is recorded.
- [ ] Death and respawn are attempted when practical.
- [ ] Match end is recorded.
- [ ] A second lobby begins without restarting Dota Flow.

## Finish

1. Click **Завершить capture** in Live Monitor.
2. Click **Папка recordings**.
3. Open the capture folder.
4. Inspect `manifest.json` and `validation-report.json`.
5. Load `events.jsonl` at `/validation`.

## Gate

A single recording must not be used for calibration when any required signal is FAIL. Collect at least five passing complete recordings. If inventory is missing, stop item-based live validation and resolve the data source before continuing.


## v0.11 manual-context checks

During the bot lobby, use at least three visible confirmations from the Live Monitor or global shortcuts:

1. confirm whether the mid/offlane wave is pushed;
2. confirm one Bottle rune or that Bottle is empty;
3. confirm a Wisdom contest, route safety, carry threat, pull or stack availability.

After the match, verify that `events.jsonl` contains `manual-context` envelopes and that the Validation/Diagnostics viewers replay them without invalid-envelope errors. Clear manual context before the second lobby to test safe fallback and session reset behavior.
