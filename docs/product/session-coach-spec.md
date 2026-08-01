# Session Coach MVP (v0.23.3)

Session Coach is a local-first development preview that helps players connect self-reported post-match state with session duration, match context, hero/role history, time of day, and Match Review quality. It offers recommendations, never restrictions, and is not a medical or psychological assessment.

## Domain and transparency

Schema v1 contains post-match check-ins, optional 1–5 energy/focus/desire scales, queue motivation, nullable match context, sessions, and daily reflections. A primary state alone is sufficient; skip is always available. `SessionBoundaryPolicy` starts a new session after 90 minutes of inactivity by default and accepts a test configuration.

The deterministic engine separately scores tilt risk, fatigue risk, and requeue impulse on 0–100 scales. Readiness is clamped to 0–100. Every contribution exposes a rule id, points, explanation, evidence, and severity. A loss alone never means tilt, and a win alone never guarantees high readiness.

Confidence combines completed check-ins, current completeness, match context, session observations, and historical volume. Personal patterns use minimum samples: 10 general, 8 time-window, 6 hero, 8 role, and 20 for an established pattern. Insights describe association in the player's history, not causation, and disclose incomplete or short-period data.

## Product surfaces

Routes are `/session`, `/session/check-in`, and `/session/reflection`. Home, Match Review, Progress, Settings, and Landing provide entry points or contextual summaries. Demo fixtures are conspicuously labelled MOCK/DEMO and use an isolated namespace.

## Limitations

This MVP uses deterministic demo context in the desktop preview. It does not test real Overwolf or Dota 2 GEP, collect real player data, predict match outcomes, or guarantee performance improvement. Future integration may attach already-available review/runtime snapshots, but subjective state will remain user-entered.
