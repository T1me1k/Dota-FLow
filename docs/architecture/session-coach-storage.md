# Session Coach storage architecture

`MemorySessionCoachRepository` implements the framework-independent repository contract for checks, reflections, sessions, privacy settings, export, and deletion. The desktop `IndexedDbSessionCoachRepository` is the browser adapter and performs no network calls. React never accesses Node or the filesystem.

Schema version 1 is validated at the record boundary. Unknown fields are tolerated. Invalid records produce a scoped storage error or enter quarantine rather than resetting the store. This establishes the migration boundary for a future v2. Electron filesystem persistence is intentionally absent until a dedicated safe IPC/preload contract exists.
