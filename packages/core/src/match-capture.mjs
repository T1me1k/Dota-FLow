import { listGepEnvelopeFeatures } from './gep-diagnostics.mjs';

export const MATCH_CAPTURE_STATES = Object.freeze({
  IDLE: 'IDLE',
  RECORDING: 'RECORDING',
  STOPPED: 'STOPPED'
});

function finiteTimestamp(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

export function createMatchCaptureId(timestamp = Date.now()) {
  return `capture-${new Date(finiteTimestamp(timestamp, Date.now())).toISOString().replaceAll(':', '-').replaceAll('.', '-')}`;
}

export class MatchCaptureTracker {
  constructor({ now = () => Date.now(), appVersion = '0.12.0' } = {}) {
    this.now = typeof now === 'function' ? now : () => Date.now();
    this.appVersion = appVersion;
    this.state = MATCH_CAPTURE_STATES.IDLE;
    this.captureId = null;
    this.startedAt = null;
    this.endedAt = null;
    this.reason = null;
    this.metadata = {};
    this.envelopeCount = 0;
    this.envelopeTypeCounts = { 'game-event': 0, 'info-update': 0, status: 0, 'manual-context': 0, 'coach-event': 0, invalid: 0 };
    this.featureCounts = new Map();
    this.matchIds = new Set();
    this.heroes = new Set();
    this.connectionStates = new Set();
    this.lastReceivedAt = null;
    this.lastBridgeState = null;
    this.lastDiagnosticSummary = null;
  }

  start(metadata = {}) {
    const startedAt = finiteTimestamp(metadata.startedAt, this.now());
    this.state = MATCH_CAPTURE_STATES.RECORDING;
    this.captureId = metadata.captureId ?? createMatchCaptureId(startedAt);
    this.startedAt = startedAt;
    this.endedAt = null;
    this.reason = null;
    this.metadata = { ...metadata, startedAt: undefined, captureId: undefined };
    this.envelopeCount = 0;
    this.envelopeTypeCounts = { 'game-event': 0, 'info-update': 0, status: 0, 'manual-context': 0, 'coach-event': 0, invalid: 0 };
    this.featureCounts.clear();
    this.matchIds.clear();
    this.heroes.clear();
    this.connectionStates.clear();
    this.lastReceivedAt = null;
    this.lastBridgeState = null;
    this.lastDiagnosticSummary = null;
    return this.snapshot();
  }

  observe(envelope, liveSnapshot) {
    if (this.state !== MATCH_CAPTURE_STATES.RECORDING) return this.snapshot();
    this.envelopeCount += 1;
    const type = envelope?.type;
    if (type in this.envelopeTypeCounts) this.envelopeTypeCounts[type] += 1;
    else this.envelopeTypeCounts.invalid += 1;
    this.lastReceivedAt = finiteTimestamp(envelope?.receivedAt, this.now());
    for (const feature of listGepEnvelopeFeatures(envelope)) {
      this.featureCounts.set(feature, (this.featureCounts.get(feature) ?? 0) + 1);
    }

    const bridge = liveSnapshot?.bridge ?? {};
    const pipelineState = liveSnapshot?.diagnostics?.pipeline?.state ?? {};
    const matchId = bridge.activeMatchId ?? pipelineState.matchId;
    if (matchId !== undefined && matchId !== null && matchId !== '') this.matchIds.add(String(matchId));
    if (pipelineState.hero) this.heroes.add(String(pipelineState.hero));
    if (bridge.state) this.connectionStates.add(String(bridge.state));
    this.lastBridgeState = bridge.state ?? this.lastBridgeState;
    this.lastDiagnosticSummary = liveSnapshot?.diagnostics?.summary
      ? { ...liveSnapshot.diagnostics.summary }
      : this.lastDiagnosticSummary;
    return this.snapshot();
  }

  stop(reason = 'MANUAL_STOP', endedAt = this.now()) {
    if (this.state === MATCH_CAPTURE_STATES.IDLE) return this.snapshot();
    this.state = MATCH_CAPTURE_STATES.STOPPED;
    this.reason = String(reason);
    this.endedAt = finiteTimestamp(endedAt, this.now());
    return this.snapshot();
  }

  snapshot(now = this.now()) {
    const current = finiteTimestamp(now, this.now());
    const end = this.endedAt ?? (this.state === MATCH_CAPTURE_STATES.RECORDING ? current : this.startedAt);
    return {
      schemaVersion: 1,
      captureId: this.captureId,
      state: this.state,
      appVersion: this.appVersion,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      durationMs: this.startedAt === null || end === null ? 0 : Math.max(0, end - this.startedAt),
      reason: this.reason,
      metadata: { ...this.metadata },
      envelopeCount: this.envelopeCount,
      envelopeTypeCounts: { ...this.envelopeTypeCounts },
      featureCounts: Object.fromEntries([...this.featureCounts].sort(([a], [b]) => a.localeCompare(b))),
      matchIds: [...this.matchIds],
      heroes: [...this.heroes],
      connectionStates: [...this.connectionStates],
      lastReceivedAt: this.lastReceivedAt,
      lastBridgeState: this.lastBridgeState,
      diagnostics: this.lastDiagnosticSummary,
      files: {
        events: 'events.jsonl',
        manifest: 'manifest.json',
        validationReport: 'validation-report.json'
      }
    };
  }
}
