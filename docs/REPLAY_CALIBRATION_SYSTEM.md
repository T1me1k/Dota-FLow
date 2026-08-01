# Replay Calibration System (v0.22.0)

Thirty bundled scenarios consume **synthetic canonical JSONL recordings** through the production `GameEventPipeline`; they are not user recordings or real Overwolf validation. Each recording has 40 meaningful clock/state/lifecycle events. Reviews are built once after replay completion, histories remain bounded, and stable checkpoint fields exclude presentation text.

Signals such as map vision, enemy buyback, inventory completeness, route safety, and team readiness remain `MANUAL`, `INFERRED`, or `UNAVAILABLE` when the canonical stream cannot prove them.
