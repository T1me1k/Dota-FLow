# Overwolf runtime integration

Architecture: React renderer → allowlisted contextBridge IPC → Electron main → framework-independent runtime service → approved Overwolf GEP adapter → LiveGepBridge → GameEventPipeline. The renderer has no Node, filesystem, process-memory, or Overwolf access. LIVE_GEP never falls back to mock: absent SDK/configuration produces `OVERWOLF_NOT_CONFIGURED`.

The repository currently contains Electron, adapter interfaces and fake-tested integration, but no separately verifiable official Overwolf Electron SDK package or whitelisting credential. Obtain the current package/application identity from Overwolf, whitelist it, and configure it on Windows; never commit credentials. Requested features are defined only by `GEP_FEATURE_MANIFEST` and registered by supported intersection.
