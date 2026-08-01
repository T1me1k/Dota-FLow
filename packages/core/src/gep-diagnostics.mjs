import { GameEventPipeline } from './live-pipeline.mjs';
import { inspectInfoUpdates, inspectRawGameEvents } from './gep-normalizer.mjs';
import { GAME_EVENT_TYPES } from './game-events.mjs';
import { coachEnvelopeToGameEvent } from './coach-events.mjs';

export const DOTA_GEP_EXPECTED_FEATURES = Object.freeze([
  'game_state',
  'game_state_changed',
  'match_state_changed',
  'clock_time_changed',
  'match_ended',
  'kill',
  'assist',
  'death',
  'cs',
  'ward_purchase_cooldown_changed',
  'xpm',
  'gpm',
  'gold',
  'hero_leveled_up',
  'hero_buyback_info_changed',
  'hero_health_mana_info',
  'hero_status_effect_changed',
  'hero_ability_skilled',
  'hero_ability_used',
  'hero_ability_cooldown_changed',
  'hero_item_cooldown_changed',
  'hero_item_changed',
  'hero_item_used',
  'match_info',
  'roster',
  'me',
  'game',
  'damage'
]);

const VALID_ENVELOPE_TYPES = new Set(['game-event', 'info-update', 'status', 'manual-context', 'coach-event']);

function finiteTimestamp(value, fallback = Date.now()) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

export function listGepEnvelopeFeatures(envelope) {
  if (envelope?.type === 'game-event') {
    const payload = envelope.payload;
    const events = Array.isArray(payload?.events) ? payload.events : Array.isArray(payload) ? payload : [payload];
    return events
      .map((event) => event?.name ?? event?.feature ?? event?.event)
      .filter((name) => typeof name === 'string' && name);
  }
  if (envelope?.type === 'info-update') {
    const payload = envelope.payload;
    const updates = Array.isArray(payload) ? payload : Array.isArray(payload?.updates) ? payload.updates : [payload];
    return updates
      .map((update) => update?.feature ?? Object.keys(update?.info ?? {})[0])
      .filter((name) => typeof name === 'string' && name);
  }
  return [];
}

export function validateGepEnvelope(value) {
  const errors = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: ['Envelope must be an object'] };
  }
  if (!VALID_ENVELOPE_TYPES.has(value.type)) errors.push(`Unsupported envelope type: ${String(value.type)}`);
  if (value.payload === undefined) errors.push('Envelope payload is missing');
  if (value.receivedAt !== undefined && !Number.isFinite(Number(value.receivedAt))) {
    errors.push('Envelope receivedAt must be a finite number');
  }
  return { ok: errors.length === 0, errors };
}

export class GepFeatureHealthTracker {
  constructor({ expectedFeatures = DOTA_GEP_EXPECTED_FEATURES, staleAfterMs = 15_000 } = {}) {
    this.staleAfterMs = Math.max(1, Number(staleAfterMs) || 15_000);
    this.features = new Map();
    for (const feature of expectedFeatures) this.#ensure(feature, true);
  }

  #ensure(name, expected = false) {
    if (!this.features.has(name)) {
      this.features.set(name, {
        name,
        expected,
        requested: false,
        count: 0,
        firstSeenAt: null,
        lastSeenAt: null,
        lastEnvelopeType: null
      });
    } else if (expected) {
      this.features.get(name).expected = true;
    }
    return this.features.get(name);
  }

  observe(envelope) {
    const receivedAt = finiteTimestamp(envelope?.receivedAt);
    if (envelope?.type === 'status' && Array.isArray(envelope?.payload?.features)) {
      for (const name of envelope.payload.features) {
        if (typeof name === 'string' && name) this.#ensure(name, true).requested = true;
      }
    }
    for (const name of listGepEnvelopeFeatures(envelope)) {
      const record = this.#ensure(name, false);
      record.count += 1;
      record.firstSeenAt ??= receivedAt;
      record.lastSeenAt = receivedAt;
      record.lastEnvelopeType = envelope.type;
    }
  }

  snapshot(now = Date.now()) {
    const timestamp = finiteTimestamp(now);
    const features = [...this.features.values()]
      .map((feature) => {
        const ageMs = feature.lastSeenAt === null ? null : Math.max(0, timestamp - feature.lastSeenAt);
        const status = feature.count === 0 ? 'UNSEEN' : ageMs > this.staleAfterMs ? 'STALE' : 'ACTIVE';
        return { ...feature, ageMs, status };
      })
      .sort((a, b) => Number(b.expected) - Number(a.expected) || a.name.localeCompare(b.name));
    return {
      staleAfterMs: this.staleAfterMs,
      summary: {
        active: features.filter((feature) => feature.status === 'ACTIVE').length,
        stale: features.filter((feature) => feature.status === 'STALE').length,
        unseen: features.filter((feature) => feature.status === 'UNSEEN').length,
        unexpected: features.filter((feature) => !feature.expected).length
      },
      features
    };
  }
}

function makeIssue(code, message, details = {}) {
  return { code, message, ...details };
}

export class GepDiagnosticSession {
  constructor({
    pipeline,
    initialState,
    coordinatorOptions,
    expectedFeatures,
    staleAfterMs = 15_000,
    gapThresholdMs = 5_000,
    maxMappings = 5_000,
    maxIssues = 1_000
  } = {}) {
    this.pipeline = pipeline ?? new GameEventPipeline({ initialState, coordinatorOptions });
    this.featureHealth = new GepFeatureHealthTracker({ expectedFeatures, staleAfterMs });
    this.gapThresholdMs = Math.max(1, Number(gapThresholdMs) || 5_000);
    this.maxMappings = Math.max(1, Number(maxMappings) || 5_000);
    this.maxIssues = Math.max(1, Number(maxIssues) || 1_000);
    this.envelopeCount = 0;
    this.canonicalEventCount = 0;
    this.ignoredMappingCount = 0;
    this.statusEnvelopeCount = 0;
    this.invalidEnvelopeCount = 0;
    this.mappings = [];
    this.issues = [];
    this.envelopeTypeCounts = { 'game-event': 0, 'info-update': 0, status: 0, 'manual-context': 0, 'coach-event': 0, invalid: 0 };
    this.firstReceivedAt = null;
    this.lastReceivedAt = null;
  }

  #pushIssue(issue) {
    this.issues.push(issue);
    if (this.issues.length > this.maxIssues) this.issues.splice(0, this.issues.length - this.maxIssues);
  }

  #pushMapping(mapping) {
    this.mappings.push(mapping);
    if (this.mappings.length > this.maxMappings) this.mappings.splice(0, this.mappings.length - this.maxMappings);
  }

  addExternalIssue(issue) {
    this.#pushIssue(issue);
  }

  ingestEnvelope(envelope) {
    const sequence = this.envelopeCount + 1;
    this.envelopeCount = sequence;
    const validation = validateGepEnvelope(envelope);
    const receivedAt = finiteTimestamp(envelope?.receivedAt, this.lastReceivedAt ?? Date.now());

    if (!validation.ok) {
      this.invalidEnvelopeCount += 1;
      this.envelopeTypeCounts.invalid += 1;
      for (const message of validation.errors) {
        this.#pushIssue(makeIssue('INVALID_ENVELOPE', message, { sequence, receivedAt }));
      }
      this.#pushMapping({
        sequence,
        index: 0,
        receivedAt,
        envelopeType: envelope?.type ?? 'invalid',
        feature: null,
        rawName: null,
        status: 'invalid',
        canonicalType: null,
        canonicalEvent: null,
        reason: validation.errors.join('; ')
      });
      return this.snapshot(receivedAt);
    }

    this.envelopeTypeCounts[envelope.type] += 1;
    this.featureHealth.observe(envelope);
    this.firstReceivedAt ??= receivedAt;

    if (this.lastReceivedAt !== null) {
      const deltaMs = receivedAt - this.lastReceivedAt;
      if (deltaMs < 0) {
        this.#pushIssue(makeIssue('OUT_OF_ORDER_RECEIPT', `Envelope timestamp moved backward by ${Math.abs(deltaMs)}ms`, {
          sequence,
          receivedAt,
          previousReceivedAt: this.lastReceivedAt
        }));
      } else if (deltaMs > this.gapThresholdMs) {
        this.#pushIssue(makeIssue('ENVELOPE_GAP', `No recorded envelope for ${deltaMs}ms`, {
          sequence,
          receivedAt,
          previousReceivedAt: this.lastReceivedAt,
          gapMs: deltaMs
        }));
      }
    }
    this.lastReceivedAt = Math.max(this.lastReceivedAt ?? receivedAt, receivedAt);

    if (envelope.type === 'manual-context') {
      const patch = envelope.payload?.patch && typeof envelope.payload.patch === 'object'
        ? envelope.payload.patch
        : {};
      const canonicalEvent = {
        type: GAME_EVENT_TYPES.ROLE_CONTEXT_UPDATED,
        source: 'manual',
        ...(Number.isFinite(Number(envelope.payload?.gameTimeSec)) ? { gameTimeSec: Number(envelope.payload.gameTimeSec) } : {}),
        payload: patch
      };
      this.pipeline.dispatch(canonicalEvent);
      this.canonicalEventCount += 1;
      this.#pushMapping({
        sequence,
        index: 0,
        receivedAt,
        envelopeType: envelope.type,
        feature: 'dota_flow_manual_context',
        rawName: envelope.payload?.command ?? 'manual-context',
        status: 'mapped',
        canonicalType: canonicalEvent.type,
        canonicalEvent,
        reason: envelope.payload?.label ?? 'Manual role context'
      });
      return this.snapshot(receivedAt);
    }

    if (envelope.type === 'coach-event') {
      const canonicalEvent = coachEnvelopeToGameEvent(envelope);
      if (!canonicalEvent) {
        this.#pushIssue(makeIssue('INVALID_COACH_EVENT', 'Coach event could not be mapped', { sequence, receivedAt }));
        return this.snapshot(receivedAt);
      }
      this.pipeline.dispatch(canonicalEvent);
      this.canonicalEventCount += 1;
      this.#pushMapping({
        sequence, index: 0, receivedAt, envelopeType: envelope.type, feature: 'dota_flow_coach',
        rawName: envelope.payload?.eventType ?? 'coach-event', status: 'mapped',
        canonicalType: canonicalEvent.type, canonicalEvent, reason: envelope.payload?.label ?? 'Coach suite event'
      });
      return this.snapshot(receivedAt);
    }

    if (envelope.type === 'status') {
      this.statusEnvelopeCount += 1;
      const message = envelope.payload?.warning ?? envelope.payload?.message ?? envelope.payload?.mode ?? 'GEP status update';
      const capabilityEvent = {
        type: 'ROLE_CONTEXT_CAPABILITIES_UPDATED',
        source: 'gep',
        payload: {
          supportedFeatures: envelope.payload?.supportedFeatures ?? [],
          missingFeatures: envelope.payload?.missingFeatures ?? [],
          requestedFeatures: envelope.payload?.features ?? envelope.payload?.requestedFeatures ?? []
        }
      };
      this.pipeline.dispatch(capabilityEvent);
      this.#pushMapping({
        sequence,
        index: 0,
        receivedAt,
        envelopeType: envelope.type,
        feature: null,
        rawName: 'status',
        status: envelope.payload?.warning ? 'warning' : 'status',
        canonicalType: null,
        canonicalEvent: null,
        reason: String(message)
      });
      if (envelope.payload?.warning || envelope.payload?.error) {
        this.#pushIssue(makeIssue('GEP_STATUS_WARNING', String(message), {
          sequence,
          receivedAt,
          error: envelope.payload?.error ?? null
        }));
      }
      return this.snapshot(receivedAt);
    }

    const inspected = envelope.type === 'game-event'
      ? inspectRawGameEvents(envelope.payload)
      : inspectInfoUpdates(envelope.payload);

    if (inspected.length === 0) {
      inspected.push({
        rawName: null,
        feature: null,
        canonicalEvent: null,
        status: 'ignored',
        reason: 'Envelope contained no inspectable updates'
      });
    }

    inspected.forEach((record, index) => {
      const beforeWarnings = this.pipeline.state.diagnostics?.warnings?.length ?? 0;
      if (record.canonicalEvent) {
        this.pipeline.dispatch(record.canonicalEvent);
        this.canonicalEventCount += 1;
      } else {
        this.ignoredMappingCount += 1;
        this.#pushIssue(makeIssue('UNMAPPED_PAYLOAD', record.reason, {
          sequence,
          index,
          receivedAt,
          envelopeType: envelope.type,
          feature: record.feature ?? null
        }));
      }

      const warnings = this.pipeline.state.diagnostics?.warnings ?? [];
      if (warnings.length > beforeWarnings) {
        for (const warning of warnings.slice(beforeWarnings)) {
          this.#pushIssue(makeIssue('PIPELINE_WARNING', warning, {
            sequence,
            index,
            receivedAt,
            canonicalType: record.canonicalEvent?.type ?? null
          }));
        }
      }

      this.#pushMapping({
        sequence,
        index,
        receivedAt,
        envelopeType: envelope.type,
        feature: record.feature ?? null,
        rawName: record.rawName ?? null,
        status: record.status,
        canonicalType: record.canonicalEvent?.type ?? null,
        canonicalEvent: record.canonicalEvent ?? null,
        reason: record.reason ?? null
      });
    });

    return this.snapshot(receivedAt);
  }

  ingestMany(envelopes = []) {
    let result = this.snapshot();
    for (const envelope of envelopes) result = this.ingestEnvelope(envelope);
    return result;
  }

  snapshot(now = this.lastReceivedAt ?? Date.now()) {
    const durationMs = this.firstReceivedAt === null || this.lastReceivedAt === null
      ? 0
      : Math.max(0, this.lastReceivedAt - this.firstReceivedAt);
    return {
      summary: {
        envelopeCount: this.envelopeCount,
        canonicalEventCount: this.canonicalEventCount,
        ignoredMappingCount: this.ignoredMappingCount,
        invalidEnvelopeCount: this.invalidEnvelopeCount,
        statusEnvelopeCount: this.statusEnvelopeCount,
        envelopeTypeCounts: { ...this.envelopeTypeCounts },
        firstReceivedAt: this.firstReceivedAt,
        lastReceivedAt: this.lastReceivedAt,
        durationMs,
        issueCount: this.issues.length
      },
      featureHealth: this.featureHealth.snapshot(now),
      mappings: [...this.mappings],
      issues: [...this.issues],
      pipeline: this.pipeline.snapshot()
    };
  }
}

export function diagnoseGepEnvelopes(envelopes, options = {}) {
  const session = new GepDiagnosticSession(options);
  return session.ingestMany(envelopes);
}
