# v0.20.1 Test Coverage

The Node test suite is split by subsystem. v0.20.1 adds dedicated role-v2, match-review and end-to-end pipeline files alongside the existing lane, objective, content, coach and hero catalog coverage. The integration contract test sends a canonical event through all snapshot engines, checks the shared decision fields and JSON serialization. A deterministic 10,000-event test checks bounded histories, snapshot size, action-change deduplication and match reset. Two JSONL fixtures are imported by `importReviewJsonl`, the same normalizer/pipeline path used for captures.

Contract assertions cover confidence range, array fields, generated match time and serialization. Existing hero catalog tests cover empty/unknown/Valve aliases, enemy draft isolation, Luna fallback prevention and baseline build honesty. Content validation covers roster uniqueness, profile/build references and schema structure; invalid content makes the CLI exit non-zero.
