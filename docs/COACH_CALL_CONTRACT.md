# Coach Call contract

A snapshot exposes `coachCall` and bounded `coachCallHistory`. The call contains primary action/domain, title, instruction, confidence (0–1), urgency, reasons, steps, secondary and suppressed actions, conflicts, blockers, missing signals, cancellation conditions, TTL/evaluation times, quality, compact strategy trace and generation time.

Quality meanings: **LIVE** current telemetry; **MANUAL** explicit player confirmation; **INFERRED** safe derivation; **STALE** expired evidence; **UNAVAILABLE** absent capability. STALE/UNAVAILABLE never unlock dangerous movement. Presentation mode changes wording only. Risk tolerance cannot suppress critical safety. Voice consumes this single call and deduplicates by action.
