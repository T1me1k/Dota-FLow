# Coach Suite implemented — v0.12

Dota Flow v0.12 adds a complete coaching loop without copying competitor code, UI or proprietary datasets. The implementation is built on the existing canonical event pipeline and remains explainable, replayable and safe when data is missing.

## Product loop

### Pre-game

- draft briefing with the strongest enemy threats and allied strengths;
- adaptive build-plan selection from the hero's calibrated plans;
- counter-item recommendations with reasons and affected enemy heroes;
- optional public player scouting through a provider interface;
- explicit `UNAVAILABLE` state when public statistics cannot be loaded.

### In-game

- periodic Power, Water and Wisdom Rune reminders;
- day/night reminders;
- manually started Roshan, Aegis, Glyph, buyback and ultimate timers;
- timer events stored as `coach-event` envelopes in the normal JSONL capture;
- priority-based voice cue selection that deduplicates repeated advice;
- live adaptive-build and counter-item cards in the Live Monitor.

### Post-game

- Flow Performance Index for economy, survival, fighting, objectives, discipline, role execution and data quality;
- three prioritized improvement suggestions;
- multi-match Flow Progress profile with averages, dimension trends, strengths and focus areas;
- browser Coach Center keeps the latest 50 local reports for progress visualization.

## Adaptive Build Advisor

The advisor scores only build plans already defined in the selected hero profile. It does not generate arbitrary item sequences. Draft pressure such as control, burst, kite, save and durability changes the score of plans containing appropriate defensive or offensive tools.

Baseline profiles with only the placeholder `baseline_manual` plan remain `NOT_CALIBRATED`.

## Public scouting

`OpenDotaScoutingProvider` accepts a SteamID64 and loads public profile, recent matches and win/loss totals. The provider is optional and isolated from the core decision engines. Rate limits, private profiles and network failures return `UNAVAILABLE`; they never block the match pipeline.

## Coach events

Coach actions use the same envelope architecture as GEP and manual context:

```json
{
  "type": "coach-event",
  "payload": {
    "eventType": "COACH_TIMER_STARTED",
    "gameTimeSec": 1120,
    "payload": {
      "kind": "ROSHAN",
      "label": "Roshan respawn"
    }
  }
}
```

Coach events are captured, diagnosed and replayed, but they do not change the GEP connection state to `LIVE`.

## Pages and commands

```text
/coach          Coach Center
/live           Live Monitor with timers and build adaptation
```

```bash
npm run coach
npm run mock
```

## Limitations

- build advice is only as accurate as the hero profile and the observed draft;
- enemy item builds require a permitted external/public provider or manual confirmation;
- Roshan/Aegis and other non-GEP timers are user-triggered until a reliable live signal is validated;
- Flow Performance Index is an explainable heuristic, not an official matchmaking rating;
- player scouting is public-data-only and must respect provider limits and user privacy.
