# Capture format v1

A capture directory contains `session.json`, `capabilities.json`, `raw-gep.jsonl`, `canonical-events.jsonl`, `snapshots.jsonl`, `diagnostics.jsonl`, and `summary.json`. JSONL records contain `schemaVersion`, `sessionId`, monotonic `sequence`, `receivedAt`, nullable `gameTimeSec`, `source`, and `payload`. Creation uses a pending directory followed by atomic rename; streams are append-only and synced on stop. Session recovery metadata starts unclean and is finalized on stop. Snapshots are written only after meaningful serialization changes and must not embed catalogs.
