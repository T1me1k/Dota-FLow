# Decision Orchestrator implemented (v0.21.0)

The framework-independent orchestrator consumes existing macro, role v2, lane, objective, power-spike and adaptive-build projections. It scores compact candidates by domain priority, urgency, confidence, data quality and window length, applies critical-health safety and preparation gates, then emits exactly one active `coachCall`. It never stores full game-state snapshots in `strategyTrace`.

`DecisionOrchestratorCoordinator` adds an 8-second hold, 0.06 switch margin, critical emergency override, TTL cancellation, meaningful-change deduplication and a bounded 120-entry history. A new match resets the coordinator. Calls are deterministic and JSON serializable.

Limitations: hero positions, fog, wave position, routes, Bottle contents, buybacks and enemy economy may not be available from GEP. They must remain MANUAL or INFERRED and unsafe actions become preparation calls.
