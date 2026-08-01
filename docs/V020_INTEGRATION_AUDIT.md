# v0.20.1 Integration Audit

## Canonical production path

| Layer | Entry / function | Input → output | Stored / consumer | Status |
|---|---|---|---|---|
| Canonical event | `GameEventPipeline.dispatch(event)` | `GameEvent` → reducer input | pipeline / replay and live bridge | production |
| Normalized state | `applyGameEvent` → `normalizeGameState` | previous state + event → finite normalized state | `pipeline.state` / every engine | production |
| Power spike | `StableDecisionCoordinator.update` | normalized state → `powerState` inside macro decision | snapshot `powerSpike` / macro, coach, review | production |
| Macro | `StableDecisionCoordinator.update` | state → stable macro decision | decision + bounded history / coach and review | production |
| Role v2 | `evaluateRoleV2` | state → complete decision contract | role decision + bounded history / coach, review, UI | **production primary** |
| Role legacy | `StableRoleDecisionCoordinator` | state → legacy stable role decision | `legacyRoleFallback` only | compatibility fallback, not evaluated on normal dispatch |
| Lane | `LaneMatchupEngine.evaluate` | state/role context → lane decision | lane decision + bounded history / review and UI | production |
| Objective | `ObjectiveEngine.evaluate` | state/objective context → objective decision | objective decision + bounded history / review and UI | production |
| Adaptive build | `AdaptiveBuildCoordinator.update` | state/draft/profile → selected plan | snapshot + bounded switch history / review and UI | production |
| Snapshot | `snapshotBase` / `snapshot` | compact engine results and histories → JSON-safe object | live bridge/provider / coach, review, UI | production; catalogs excluded |
| Match review | `importReviewJsonl` → canonical normalizers → pipeline → `createMatchReview` | capture JSONL → timeline/outcome windows/metrics/FPI | report / Replay provider and review UI | production replay path |
| UI model | runtime selectors in `apps/desktop/src/runtime/view-models.ts` | runtime snapshot → explicit view state/value | React runtime context / cards | production desktop contract |

## Gaps found and corrected

* The pipeline instantiated only `StableRoleDecisionCoordinator`; five v2 modules were effectively unused. The v2 dispatcher is now the sole normal role evaluation, marks `engineVersion` and `strategyId`, and uses a generic safe strategy for unknown roles.
* Role v2 outputs did not consistently expose the common decision contract. The adapter now fills warnings, blockers, missing signals, quality and match time without changing the selected action.
* Histories were unbounded. Per-engine pipeline histories are capped at 200 and reset on `MATCH_STARTED`.
* Desktop Live and Review screens embedded demo values and imported no runtime contract. They now consume one provider/context boundary and pure view models.
* `desktop:build` generated a placeholder after source validation. It now invokes real `vite build`; offline structural validation is separately named `desktop:validate`.

Manual/inferred limits remain: lane position, route safety, vision, cooldowns, enemy buyback and objective readiness may be MANUAL/INFERRED when GEP does not expose proof. Unsafe calls remain blocked on stale/unavailable evidence.

## Superseded integration layer in v0.21

The v0.20 engines remain evidence producers. `decision-orchestrator.mjs` is now the only player-facing arbitration boundary; engine cards are diagnostic projections.

## v0.22 architecture addendum

Replay calibration reuses recording parsing, canonical reduction, `GameEventPipeline`, existing engines, Decision Orchestrator, bounded histories, and completion-time Match Review. Advice rendering and Scenario Workbench view models are downstream presentation layers, not decision engines.
