import { GepDiagnosticSession, validateGepEnvelope } from './gep-diagnostics.mjs';
import { GAME_EVENT_TYPES } from './game-events.mjs';
import { toCanonicalGameEvents, toCanonicalInfoEvents } from './gep-normalizer.mjs';
import { createManualContextEnvelope } from './manual-context.mjs';

export const LIVE_BRIDGE_STATES = Object.freeze({
  WAITING: 'WAITING',
  LIVE: 'LIVE',
  DEGRADED: 'DEGRADED',
  UNAVAILABLE: 'UNAVAILABLE',
  STALE: 'STALE',
  STOPPED: 'STOPPED'
});

function finiteTimestamp(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function stableValue(value, seen = new WeakSet()) {
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);
  if (Array.isArray(value)) return value.map((entry) => stableValue(entry, seen));
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, stableValue(value[key], seen)])
  );
}

export function fingerprintGepEnvelope(envelope) {
  if (!envelope || typeof envelope !== 'object') return null;
  const explicitId = envelope.envelopeId ?? envelope.sourceEventId ?? envelope.sourceSequence;
  if (explicitId !== undefined && explicitId !== null) {
    return `source:${String(explicitId)}`;
  }
  try {
    return JSON.stringify(stableValue({
      type: envelope.type,
      gameId: envelope.gameId ?? null,
      payload: envelope.payload,
      receivedAt: envelope.receivedAt ?? null
    }));
  } catch {
    return null;
  }
}

function hasExplicitEnvelopeIdentity(envelope) {
  return envelope?.envelopeId !== undefined
    || envelope?.sourceEventId !== undefined
    || envelope?.sourceSequence !== undefined;
}

function canonicalEventsFromEnvelope(envelope) {
  if (envelope?.type === 'game-event') return toCanonicalGameEvents(envelope.payload);
  if (envelope?.type === 'info-update') return toCanonicalInfoEvents(envelope.payload);
  return [];
}

function matchIdFromEnvelope(envelope) {
  const matchEvent = canonicalEventsFromEnvelope(envelope)
    .find((event) => event.type === GAME_EVENT_TYPES.MATCH_IDENTIFIED
      || (event.type === GAME_EVENT_TYPES.GAME_SNAPSHOT && event.payload?.matchId));
  const value = matchEvent?.payload?.matchId;
  return value === undefined || value === null || value === '' ? null : String(value);
}

function compactArchive(report, metadata) {
  const state = report.pipeline.state;
  return {
    ...metadata,
    summary: report.summary,
    featureHealth: report.featureHealth.summary,
    issueCount: report.issues.length,
    finalState: {
      source: state.source,
      matchId: state.matchId,
      phase: state.phase,
      hero: state.hero,
      team: state.team,
      gameTimeSec: state.gameTimeSec,
      level: state.level,
      gold: state.gold,
      gpm: state.gpm,
      inventory: state.inventory,
      targetItem: state.targetItem
    },
    finalDecision: report.pipeline.decision,
    decisionHistory: report.pipeline.decisionHistory
  };
}

function statusConnection(envelope, validation) {
  if (!validation.ok) {
    return {
      state: LIVE_BRIDGE_STATES.DEGRADED,
      message: validation.errors.join('; ')
    };
  }
  if (envelope.type !== 'status') {
    return { state: LIVE_BRIDGE_STATES.LIVE, message: 'Receiving GEP data' };
  }

  const payload = envelope.payload && typeof envelope.payload === 'object' ? envelope.payload : {};
  const mode = String(payload.mode ?? '').toLowerCase();
  const connection = String(payload.connection ?? payload.state ?? '').toLowerCase();
  if (mode === 'mock' || payload.available === false || connection === 'unavailable') {
    return {
      state: LIVE_BRIDGE_STATES.UNAVAILABLE,
      message: String(payload.message ?? 'Overwolf GEP runtime is unavailable')
    };
  }
  if (payload.warning || payload.error || connection === 'disconnected' || connection === 'reconnecting') {
    return {
      state: LIVE_BRIDGE_STATES.DEGRADED,
      message: String(payload.warning ?? payload.error ?? payload.message ?? connection)
    };
  }
  return {
    state: LIVE_BRIDGE_STATES.LIVE,
    message: String(payload.message ?? payload.mode ?? 'GEP connected')
  };
}

export class LiveGepBridge {
  constructor({
    initialState,
    coordinatorOptions,
    expectedFeatures,
    staleAfterMs,
    gapThresholdMs,
    maxMappings,
    maxIssues,
    connectionStaleAfterMs = 15_000,
    dedupeWindowMs = 30_000,
    maxFingerprints = 5_000,
    maxArchives = 10,
    maxBridgeEvents = 500,
    maxSeenMatchIds = 100,
    now = () => Date.now(),
    sessionFactory
  } = {}) {
    this.now = typeof now === 'function' ? now : () => Date.now();
    this.sessionFactory = sessionFactory;
    this.sessionOptions = {
      initialState,
      coordinatorOptions,
      expectedFeatures,
      staleAfterMs,
      gapThresholdMs,
      maxMappings,
      maxIssues
    };
    this.connectionStaleAfterMs = Math.max(1, Number(connectionStaleAfterMs) || 15_000);
    this.dedupeWindowMs = Math.max(0, Number(dedupeWindowMs) || 0);
    this.maxFingerprints = Math.max(1, Number(maxFingerprints) || 5_000);
    this.maxArchives = Math.max(0, Number(maxArchives) || 0);
    this.maxBridgeEvents = Math.max(1, Number(maxBridgeEvents) || 500);
    this.maxSeenMatchIds = Math.max(1, Number(maxSeenMatchIds) || 100);

    this.receivedEnvelopeCount = 0;
    this.forwardedEnvelopeCount = 0;
    this.duplicateEnvelopeCount = 0;
    this.droppedEnvelopeCount = 0;
    this.manualEnvelopeCount = 0;
    this.coachEnvelopeCount = 0;
    this.manualSequence = 0;
    this.sessionGeneration = 0;
    this.activeGameId = null;
    this.activeMatchId = null;
    this.lastSeenAt = null;
    this.lastForwardedAt = null;
    this.connectionState = LIVE_BRIDGE_STATES.WAITING;
    this.connectionMessage = 'Waiting for the first GEP envelope';
    this.stopped = false;
    this.archives = [];
    this.bridgeEvents = [];
    this.listeners = new Set();
    this.fingerprints = new Map();
    this.seenMatchIds = new Set();
    this.#createSession(this.now());
  }

  #createSession(startedAt) {
    this.sessionGeneration += 1;
    this.sessionStartedAt = finiteTimestamp(startedAt, this.now());
    this.session = this.sessionFactory
      ? this.sessionFactory(this.sessionOptions)
      : new GepDiagnosticSession(this.sessionOptions);
  }

  #pushBridgeEvent(event) {
    this.bridgeEvents.push(event);
    if (this.bridgeEvents.length > this.maxBridgeEvents) {
      this.bridgeEvents.splice(0, this.bridgeEvents.length - this.maxBridgeEvents);
    }
  }

  #rememberMatchId(matchId) {
    if (matchId === undefined || matchId === null || matchId === '') return;
    const value = String(matchId);
    this.seenMatchIds.delete(value);
    this.seenMatchIds.add(value);
    while (this.seenMatchIds.size > this.maxSeenMatchIds) {
      this.seenMatchIds.delete(this.seenMatchIds.values().next().value);
    }
  }

  #setConnection(state, message, receivedAt) {
    if (this.connectionState !== state || this.connectionMessage !== message) {
      this.#pushBridgeEvent({
        code: 'CONNECTION_STATE_CHANGED',
        at: receivedAt,
        previousState: this.connectionState,
        state,
        message
      });
    }
    this.connectionState = state;
    this.connectionMessage = message;
  }

  #pruneFingerprints(observedAt) {
    if (this.dedupeWindowMs > 0) {
      for (const [fingerprint, record] of this.fingerprints) {
        if (!record.persistent && observedAt - record.observedAt > this.dedupeWindowMs) {
          this.fingerprints.delete(fingerprint);
        }
      }
    }
    while (this.fingerprints.size > this.maxFingerprints) {
      this.fingerprints.delete(this.fingerprints.keys().next().value);
    }
  }

  #isDuplicate(envelope, observedAt) {
    if (this.dedupeWindowMs === 0) return false;
    this.#pruneFingerprints(observedAt);
    const fingerprint = fingerprintGepEnvelope(envelope);
    if (!fingerprint) return false;
    const previous = this.fingerprints.get(fingerprint);
    if (previous) return { fingerprint, previous };
    this.fingerprints.set(fingerprint, {
      observedAt,
      persistent: hasExplicitEnvelopeIdentity(envelope),
      receivedSequence: this.receivedEnvelopeCount
    });
    this.#pruneFingerprints(observedAt);
    return false;
  }

  #archiveCurrent(reason, endedAt) {
    if (this.maxArchives === 0 || this.session.envelopeCount === 0) return;
    const report = this.session.snapshot(endedAt);
    const matchId = report.pipeline.state.matchId ?? this.activeMatchId;
    this.archives.push(compactArchive(report, {
      id: matchId ? `match:${matchId}` : `live:${this.sessionGeneration}`,
      reason,
      generation: this.sessionGeneration,
      startedAt: this.sessionStartedAt,
      endedAt,
      gameId: this.activeGameId,
      matchId
    }));
    if (this.archives.length > this.maxArchives) {
      this.archives.splice(0, this.archives.length - this.maxArchives);
    }
  }

  #rotateSession(reason, receivedAt, nextMatchId = null) {
    const previousMatchId = this.activeMatchId ?? this.session.pipeline.state.matchId ?? null;
    this.#rememberMatchId(previousMatchId);
    this.#rememberMatchId(nextMatchId);
    this.#archiveCurrent(reason, receivedAt);
    this.#createSession(receivedAt);
    this.activeMatchId = nextMatchId;
    this.fingerprints.clear();
    this.#pushBridgeEvent({
      code: 'SESSION_ROTATED',
      at: receivedAt,
      reason,
      previousMatchId,
      matchId: nextMatchId,
      generation: this.sessionGeneration
    });
  }

  #notify(snapshot) {
    for (const listener of [...this.listeners]) {
      try {
        listener(snapshot);
      } catch (error) {
        this.#pushBridgeEvent({
          code: 'LISTENER_ERROR',
          at: this.now(),
          message: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  ingestEnvelope(envelope) {
    const fallbackNow = this.now();
    const receivedAt = finiteTimestamp(envelope?.receivedAt, fallbackNow);
    this.receivedEnvelopeCount += 1;
    this.lastSeenAt = Math.max(this.lastSeenAt ?? receivedAt, receivedAt);

    if (this.stopped) {
      this.droppedEnvelopeCount += 1;
      this.#pushBridgeEvent({
        code: 'ENVELOPE_DROPPED',
        at: receivedAt,
        reason: 'Bridge is stopped',
        receivedSequence: this.receivedEnvelopeCount
      });
      const snapshot = this.snapshot(receivedAt);
      this.#notify(snapshot);
      return snapshot;
    }

    const prepared = envelope && typeof envelope === 'object' && !Array.isArray(envelope)
      ? { ...envelope, receivedAt }
      : envelope;
    const incomingMatchId = matchIdFromEnvelope(prepared);
    const currentMatchId = this.activeMatchId ?? this.session.pipeline.state.matchId;
    if (incomingMatchId && currentMatchId && incomingMatchId !== String(currentMatchId)) {
      const staleMatchIdentity = this.seenMatchIds.has(incomingMatchId)
        || (this.lastForwardedAt !== null && receivedAt < this.lastForwardedAt);
      if (staleMatchIdentity) {
        this.droppedEnvelopeCount += 1;
        const issue = {
          code: 'STALE_MATCH_IDENTITY',
          message: `Ignored late match identity ${incomingMatchId}; active match is ${String(currentMatchId)}`,
          receivedAt,
          incomingMatchId,
          activeMatchId: String(currentMatchId)
        };
        this.session.addExternalIssue(issue);
        this.#pushBridgeEvent({
          code: 'STALE_MATCH_ENVELOPE_DROPPED',
          at: receivedAt,
          incomingMatchId,
          activeMatchId: String(currentMatchId),
          receivedSequence: this.receivedEnvelopeCount
        });
        const snapshot = this.snapshot(receivedAt);
        this.#notify(snapshot);
        return snapshot;
      }
      this.#rotateSession('MATCH_ID_CHANGED', receivedAt, incomingMatchId);
    }

    const duplicate = this.#isDuplicate(prepared, fallbackNow);
    if (duplicate) {
      this.duplicateEnvelopeCount += 1;
      this.#pushBridgeEvent({
        code: 'DUPLICATE_ENVELOPE',
        at: receivedAt,
        receivedSequence: this.receivedEnvelopeCount,
        originalReceivedSequence: duplicate.previous.receivedSequence
      });
      const snapshot = this.snapshot(receivedAt);
      this.#notify(snapshot);
      return snapshot;
    }

    const validation = validateGepEnvelope(prepared);
    if (this.session.envelopeCount === 0) this.sessionStartedAt = receivedAt;
    const report = this.session.ingestEnvelope(prepared);
    const isManualContext = prepared?.type === 'manual-context';
    const isCoachEvent = prepared?.type === 'coach-event';
    if (isManualContext || isCoachEvent) {
      if (isManualContext) {
        this.manualEnvelopeCount += 1;
        this.#pushBridgeEvent({
          code: 'MANUAL_CONTEXT_APPLIED', at: receivedAt, command: prepared.payload?.command ?? null,
          message: prepared.payload?.label ?? 'Manual context applied'
        });
      } else {
        this.coachEnvelopeCount += 1;
        this.#pushBridgeEvent({
          code: 'COACH_EVENT_APPLIED', at: receivedAt, eventType: prepared.payload?.eventType ?? null,
          message: prepared.payload?.label ?? 'Coach event applied'
        });
      }
    } else {
      this.forwardedEnvelopeCount += 1;
      this.lastForwardedAt = Math.max(this.lastForwardedAt ?? receivedAt, receivedAt);
      if (Number.isFinite(Number(prepared?.gameId))) this.activeGameId = Number(prepared.gameId);
      this.activeMatchId = report.pipeline.state.matchId ?? incomingMatchId ?? this.activeMatchId;
      this.#rememberMatchId(this.activeMatchId);
      const connection = statusConnection(prepared, validation);
      this.#setConnection(connection.state, connection.message, receivedAt);
    }
    if (!validation.ok) {
      this.#pushBridgeEvent({
        code: 'INVALID_ENVELOPE_FORWARDED',
        at: receivedAt,
        errors: validation.errors,
        receivedSequence: this.receivedEnvelopeCount
      });
    }

    const snapshot = this.snapshot(receivedAt);
    this.#notify(snapshot);
    return snapshot;
  }

  ingestManualContext(command, options = {}) {
    this.manualSequence += 1;
    const gameTimeSec = options.gameTimeSec ?? this.session.pipeline.state.gameTimeSec;
    return this.ingestEnvelope(createManualContextEnvelope(command, {
      ...options,
      gameTimeSec,
      receivedAt: options.receivedAt ?? this.now(),
      sourceSequence: options.sourceSequence ?? `manual:${this.sessionGeneration}:${this.manualSequence}`
    }));
  }

  ingestMany(envelopes = []) {
    let snapshot = this.snapshot();
    for (const envelope of envelopes) snapshot = this.ingestEnvelope(envelope);
    return snapshot;
  }

  reset({ reason = 'MANUAL_RESET', archive = true, initialState } = {}) {
    const now = this.now();
    if (archive) this.#archiveCurrent(reason, now);
    if (initialState !== undefined) this.sessionOptions.initialState = initialState;
    this.#createSession(now);
    this.activeMatchId = null;
    this.activeGameId = null;
    this.fingerprints.clear();
    this.stopped = false;
    this.#setConnection(LIVE_BRIDGE_STATES.WAITING, 'Waiting for the first GEP envelope', now);
    this.#pushBridgeEvent({ code: 'BRIDGE_RESET', at: now, reason, generation: this.sessionGeneration });
    const snapshot = this.snapshot(now);
    this.#notify(snapshot);
    return snapshot;
  }

  stop(reason = 'MANUAL_STOP') {
    const now = this.now();
    this.stopped = true;
    this.#setConnection(LIVE_BRIDGE_STATES.STOPPED, String(reason), now);
    this.#pushBridgeEvent({ code: 'BRIDGE_STOPPED', at: now, reason: String(reason) });
    const snapshot = this.snapshot(now);
    this.#notify(snapshot);
    return snapshot;
  }

  subscribe(listener, { emitCurrent = true } = {}) {
    if (typeof listener !== 'function') throw new TypeError('Live bridge listener must be a function');
    this.listeners.add(listener);
    if (emitCurrent) listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  snapshot(now = this.now()) {
    const timestamp = finiteTimestamp(now, this.now());
    const report = this.session.snapshot(timestamp);
    const ageMs = this.lastForwardedAt === null ? null : Math.max(0, timestamp - this.lastForwardedAt);
    const state = this.stopped
      ? LIVE_BRIDGE_STATES.STOPPED
      : this.connectionState !== LIVE_BRIDGE_STATES.WAITING
        && this.connectionState !== LIVE_BRIDGE_STATES.UNAVAILABLE
        && ageMs !== null
        && ageMs > this.connectionStaleAfterMs
        ? LIVE_BRIDGE_STATES.STALE
        : this.connectionState;
    const matchId = report.pipeline.state.matchId ?? this.activeMatchId;

    return {
      bridge: {
        state,
        message: state === LIVE_BRIDGE_STATES.STALE
          ? `No forwarded GEP envelope for ${ageMs}ms`
          : this.connectionMessage,
        receivedEnvelopeCount: this.receivedEnvelopeCount,
        forwardedEnvelopeCount: this.forwardedEnvelopeCount,
        duplicateEnvelopeCount: this.duplicateEnvelopeCount,
        droppedEnvelopeCount: this.droppedEnvelopeCount,
        manualEnvelopeCount: this.manualEnvelopeCount,
        coachEnvelopeCount: this.coachEnvelopeCount,
        lastSeenAt: this.lastSeenAt,
        lastForwardedAt: this.lastForwardedAt,
        ageMs,
        activeGameId: this.activeGameId,
        activeMatchId: matchId,
        session: {
          id: matchId ? `match:${matchId}` : `live:${this.sessionGeneration}`,
          generation: this.sessionGeneration,
          startedAt: this.sessionStartedAt,
          archiveCount: this.archives.length
        },
        subscriberCount: this.listeners.size
      },
      diagnostics: report,
      archives: [...this.archives],
      bridgeEvents: [...this.bridgeEvents]
    };
  }
}

export function createLiveGepBridge(options) {
  return new LiveGepBridge(options);
}
