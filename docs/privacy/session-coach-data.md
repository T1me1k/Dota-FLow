# Session Coach data and privacy

Session Coach stores schema-v1 check-ins, nullable match snapshots, sessions, reflections, settings, and optional notes locally. Browser production storage uses IndexedDB; the framework-independent memory adapter supports tests. There is no cloud sync, account, advertising use, mood analytics payload, or Session Coach network transport.

The feature can be disabled, every check-in can be skipped or deleted, and all history can be exported as versioned JSON or deleted after confirmation. Freeform notes are off by default and explicitly local. Export metadata includes schema, timestamp, storage mode, and record collections. Import is not included. Corrupt records are quarantined while valid records remain readable. Demo records use a separate namespace and must never be merged without an explicit development action.
