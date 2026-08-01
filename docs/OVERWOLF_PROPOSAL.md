# Overwolf app proposal draft

## App name

Dota Flow

## One-line description

A public Dota 2 in-game macro coaching overlay that gives concise, explainable guidance based only on live data and information available to the local player.

## Public-facing value

Dota Flow helps carry players understand whether their next short-term priority should be to farm, connect to teammates, fight, pressure an objective, or reset and spend resources.

The first version displays a compact overlay with one recommendation, the player's progress toward a selected key item, and up to three reasons behind the recommendation.

## Initial feature set

- personal game-time, level, gold, GPM, XPM, health, and mana tracking;
- personal ability and ultimate readiness where supported;
- personal buyback state where supported;
- selected key-item progress;
- draft-aware hero profile selection;
- rule-based FARM / CONNECT / FIGHT / PRESSURE / RESET recommendation;
- desktop debugger showing the data received from GEP;
- local event recording for diagnostics;
- user-controlled overlay visibility and position.

## Future feature under separate compliance review

Farm GPS would optionally identify the local hero's visible minimap position and draw a route on Dota Flow's own overlay. It would only use pixels already visible on the local user's screen. It would not reveal fog-of-war data or hidden game state.

We request an explicit compliance decision before enabling any screen-analysis feature.

## Fair-play and safety commitments

Dota Flow will not:

- read or inject into Dota 2 process memory;
- automate clicks, key presses, movement, ability use, purchases, or camera control;
- reveal fog-of-war information;
- predict hidden enemy locations from prohibited data;
- expose player identities before Dota 2 makes them available;
- alter game files;
- provide information that the local user could not legally observe;
- run as a faceless background bridge.

The app will have a visible desktop window and a user-controlled in-game overlay.

## Data and privacy

The probe stores event logs locally for diagnostics. Uploading diagnostics will be opt-in. Public versions will provide clear privacy disclosures and deletion controls.

## Monetization plan

The core recommendation overlay will be free. A future subscription may include additional hero profiles, deeper post-match review, route presets, and personalization. Any monetization inside Overwolf will use approved Overwolf monetization methods.

## Questions for DevRel

1. Is Dota 2 GEP currently available for this app in the OW-Electron development environment?
2. Which Dota game ID should be used for development and production registration?
3. May the app crop and analyze only the local user's visible minimap pixels to locate the local hero icon?
4. May it draw a suggested route exclusively in its own transparent overlay without modifying or interacting with the game?
5. Are there additional restrictions on live macro recommendations based on personal gold, GPM, health, mana, cooldowns, draft, and game time?
