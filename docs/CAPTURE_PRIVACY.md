# Capture privacy

Run `npm run capture:redact -- input output` before sharing. Export removes known identity fields and replaces local paths; Steam-like identifiers in values are hashed. It preserves game-relevant events. Do not capture credentials, arbitrary metadata, process dumps, machine/user names, or private absolute paths. Redaction never mutates its input.
