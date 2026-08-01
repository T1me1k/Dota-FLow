# Runtime Provider Contract

`DotaFlowRuntimeProvider` is framework independent: it provides asynchronous snapshots, subscriptions, optional recording loading, manual context and timer commands. React accesses it only through `RuntimeProvider`/`useRuntime`.

* `MockRuntimeProvider`: deterministic development scenarios selected with `?scenario=reset` (or `empty`).
* `ReplayRuntimeProvider`: deterministic recording source adapter used by Match Review.
* `ElectronIpcRuntimeProvider`: prepared fail-closed boundary; deliberately not connected to Windows/Overwolf IPC.

Pure selectors expose `loading`, `empty`, `unavailable`, `stale`, `error`, and `ready` states for macro, role, lane, objective, adaptive build, quality badges, review timeline and progress metrics.

## v0.21 additions

Every live snapshot may expose `coachCall` and `coachCallHistory`. Providers must preserve confidence 0–1, urgency, cancellation/TTL fields, compact trace and quality. Mock and replay providers must not synthesize unavailable LIVE evidence.

## Scenario capabilities (v0.22)

Providers may expose `listScenarios`, `runScenario`, `runScenarioCategory`, `loadReplayScenario`, and `getScenarioGoldenDiff`. Mock and Replay providers implement them; Electron IPC throws a clear fail-closed error until connected.

## v0.23 service and IPC

The framework-independent service owns start/stop/status/snapshot/subscription, manual context, coach timer, capture, and bounded diagnostics. Electron preload exposes only allowlisted runtime/capture/manual/timer/diagnostic operations; subscriptions return an unsubscribe callback. LIVE_GEP renderer uses `ElectronIpcRuntimeProvider`; mock and replay remain independent.
