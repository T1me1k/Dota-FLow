# Runtime Provider Contract

`DotaFlowRuntimeProvider` is framework independent: it provides asynchronous snapshots, subscriptions, optional recording loading, manual context and timer commands. React accesses it only through `RuntimeProvider`/`useRuntime`.

* `MockRuntimeProvider`: deterministic development scenarios selected with `?scenario=reset` (or `empty`).
* `ReplayRuntimeProvider`: deterministic recording source adapter used by Match Review.
* `ElectronIpcRuntimeProvider`: prepared fail-closed boundary; deliberately not connected to Windows/Overwolf IPC.

Pure selectors expose `loading`, `empty`, `unavailable`, `stale`, `error`, and `ready` states for macro, role, lane, objective, adaptive build, quality badges, review timeline and progress metrics.

## v0.21 additions

Every live snapshot may expose `coachCall` and `coachCallHistory`. Providers must preserve confidence 0–1, urgency, cancellation/TTL fields, compact trace and quality. Mock and replay providers must not synthesize unavailable LIVE evidence.
