# Runtime diagnostics

Statuses are structured as `{code,severity,message,remediation,details,occurredAt}` and bounded to 200 entries: `OVERWOLF_NOT_CONFIGURED`, `OVERWOLF_RUNTIME_UNAVAILABLE`, `DOTA_NOT_RUNNING`, `GEP_INITIALIZING`, `GEP_READY`, `GEP_PARTIAL`, `GEP_DISCONNECTED`, `MATCH_NOT_DETECTED`, `MATCH_ACTIVE`, `CAPTURE_ACTIVE`, `CAPTURE_STOPPED`, `CAPTURE_RECOVERED`. User UI receives safe messages, never stack traces; developer-only logs may retain stacks.
