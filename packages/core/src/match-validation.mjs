import { GAME_EVENT_TYPES } from './game-events.mjs';
import { diagnoseJsonlRecording, parseJsonl } from './recording.mjs';

export const MATCH_VALIDATION_PROFILES = Object.freeze({
  SINGLE_MATCH: 'single-match',
  RELEASE: 'release'
});

const CORE_REQUIRED_FEATURES = new Set([
  'clock_time_changed',
  'gold',
  'gpm',
  'hero_leveled_up',
  'hero_health_mana_info',
  'hero_item_changed',
  'match_info',
  'me',
  'game',
  'game_state',
  'game_state_changed',
  'match_state_changed',
  'match_ended'
]);

function parseMaybeJson(value) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function valueKind(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (Number.isInteger(value)) return 'integer';
  return typeof value;
}

function compactSample(value, maxLength = 240) {
  let text;
  try {
    text = JSON.stringify(value);
  } catch {
    text = String(value);
  }
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

function gameCandidates(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.events)) return payload.events;
  return payload === undefined || payload === null ? [] : [payload];
}

function infoCandidates(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.updates)) return payload.updates;
  return payload === undefined || payload === null ? [] : [payload];
}

function payloadEntries(envelopes) {
  const entries = [];
  for (const envelope of envelopes) {
    const receivedAt = Number(envelope?.receivedAt);
    if (envelope?.type === 'game-event') {
      for (const raw of gameCandidates(envelope.payload)) {
        const feature = raw?.name ?? raw?.feature ?? raw?.event ?? 'unknown';
        const rawPayload = raw?.data ?? raw?.value ?? raw;
        entries.push({
          feature: String(feature),
          envelopeType: envelope.type,
          receivedAt: Number.isFinite(receivedAt) ? receivedAt : null,
          rawPayload,
          parsedPayload: parseMaybeJson(rawPayload)
        });
      }
    } else if (envelope?.type === 'info-update') {
      for (const raw of infoCandidates(envelope.payload)) {
        const feature = raw?.feature ?? raw?.category ?? Object.keys(raw?.info ?? {})[0] ?? 'unknown';
        const nested = raw?.info?.[feature];
        const parsedValue = parseMaybeJson(raw?.value);
        const parsedPayload = nested !== undefined
          ? parseMaybeJson(nested)
          : raw?.key !== undefined
            ? { [raw.key]: parsedValue }
            : parseMaybeJson(raw);
        entries.push({
          feature: String(feature),
          envelopeType: envelope.type,
          receivedAt: Number.isFinite(receivedAt) ? receivedAt : null,
          rawPayload: nested !== undefined ? nested : raw?.value ?? raw,
          parsedPayload
        });
      }
    }
  }
  return entries;
}

function createContract(entry) {
  return {
    feature: entry.feature,
    count: 0,
    envelopeTypes: new Set(),
    firstReceivedAt: null,
    lastReceivedAt: null,
    timestamps: [],
    rawKinds: new Map(),
    parsedKinds: new Map(),
    stringifiedJsonCount: 0,
    resetLikeCount: 0,
    keys: new Map(),
    samples: []
  };
}

function addCount(map, key) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function isResetLike(value) {
  if (value === null || value === '' || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (value && typeof value === 'object') {
    const values = Object.values(value);
    return values.length === 0 || values.every((entry) => entry === null || entry === '' || entry === undefined);
  }
  return false;
}

export function inferGepPayloadContracts(envelopes = []) {
  const contracts = new Map();
  for (const entry of payloadEntries(envelopes)) {
    const contract = contracts.get(entry.feature) ?? createContract(entry);
    contracts.set(entry.feature, contract);
    contract.count += 1;
    contract.envelopeTypes.add(entry.envelopeType);
    if (entry.receivedAt !== null) {
      contract.firstReceivedAt ??= entry.receivedAt;
      contract.lastReceivedAt = Math.max(contract.lastReceivedAt ?? entry.receivedAt, entry.receivedAt);
      contract.timestamps.push(entry.receivedAt);
    }
    const rawKind = valueKind(entry.rawPayload);
    const parsedKind = valueKind(entry.parsedPayload);
    addCount(contract.rawKinds, rawKind);
    addCount(contract.parsedKinds, parsedKind);
    if (rawKind === 'string' && parsedKind !== 'string') contract.stringifiedJsonCount += 1;
    if (isResetLike(entry.parsedPayload)) contract.resetLikeCount += 1;

    if (entry.parsedPayload && typeof entry.parsedPayload === 'object' && !Array.isArray(entry.parsedPayload)) {
      for (const [key, value] of Object.entries(entry.parsedPayload)) {
        const keyRecord = contract.keys.get(key) ?? { name: key, count: 0, nullCount: 0, types: new Map(), samples: [] };
        keyRecord.count += 1;
        if (value === null || value === undefined) keyRecord.nullCount += 1;
        addCount(keyRecord.types, valueKind(value));
        const sample = compactSample(value, 80);
        if (!keyRecord.samples.includes(sample) && keyRecord.samples.length < 3) keyRecord.samples.push(sample);
        contract.keys.set(key, keyRecord);
      }
    }

    const sample = compactSample(entry.parsedPayload);
    if (!contract.samples.includes(sample) && contract.samples.length < 3) contract.samples.push(sample);
  }

  return [...contracts.values()].map((contract) => {
    const timestamps = contract.timestamps.sort((a, b) => a - b);
    const intervals = timestamps.slice(1).map((value, index) => value - timestamps[index]);
    const averageIntervalMs = intervals.length
      ? Math.round(intervals.reduce((sum, value) => sum + value, 0) / intervals.length)
      : null;
    return {
      feature: contract.feature,
      count: contract.count,
      envelopeTypes: [...contract.envelopeTypes].sort(),
      firstReceivedAt: contract.firstReceivedAt,
      lastReceivedAt: contract.lastReceivedAt,
      frequency: {
        averageIntervalMs,
        minIntervalMs: intervals.length ? Math.min(...intervals) : null,
        maxIntervalMs: intervals.length ? Math.max(...intervals) : null
      },
      rawKinds: Object.fromEntries(contract.rawKinds),
      parsedKinds: Object.fromEntries(contract.parsedKinds),
      stringifiedJsonCount: contract.stringifiedJsonCount,
      resetLikeCount: contract.resetLikeCount,
      keys: [...contract.keys.values()].map((record) => ({
        name: record.name,
        count: record.count,
        nullCount: record.nullCount,
        types: Object.fromEntries(record.types),
        samples: record.samples
      })).sort((a, b) => a.name.localeCompare(b.name)),
      samples: contract.samples
    };
  }).sort((a, b) => a.feature.localeCompare(b.feature));
}


function analyzeFeatureRegistration(envelopes) {
  const statuses = envelopes.filter((envelope) => envelope?.type === 'status');
  const registrations = statuses
    .map((envelope) => envelope?.payload)
    .filter((payload) => payload && typeof payload === 'object' && (
      Array.isArray(payload.features)
      || Array.isArray(payload.supportedFeatures)
      || Array.isArray(payload.missingFeatures)
    ));
  const announced = new Set(registrations.flatMap((payload) => Array.isArray(payload.features) ? payload.features : []));
  const supported = new Set(registrations.flatMap((payload) => Array.isArray(payload.supportedFeatures) ? payload.supportedFeatures : []));
  const missing = new Set(registrations.flatMap((payload) => Array.isArray(payload.missingFeatures) ? payload.missingFeatures : []));
  const missingRequired = [...missing].filter((feature) => CORE_REQUIRED_FEATURES.has(feature));
  return {
    statusEnvelopeCount: statuses.length,
    registrationEnvelopeCount: registrations.length,
    announcedFeatures: [...announced].sort(),
    supportedFeatures: [...supported].sort(),
    missingFeatures: [...missing].sort(),
    missingRequiredFeatures: missingRequired.sort()
  };
}

function canonicalEvents(report) {
  return report.mappings.flatMap((mapping) => mapping.canonicalEvent ? [mapping.canonicalEvent] : []);
}

function numeric(value) {
  return Number.isFinite(Number(value));
}

function signal(id, label, required, pass, evidence, message) {
  return { id, label, required, pass: Boolean(pass), evidence, message };
}

function analyzeSignals(report, profile, featureRegistration) {
  const events = canonicalEvents(report);
  const byType = new Map();
  for (const event of events) {
    if (!byType.has(event.type)) byType.set(event.type, []);
    byType.get(event.type).push(event);
  }

  const snapshots = byType.get(GAME_EVENT_TYPES.GAME_SNAPSHOT) ?? [];
  const matchEvents = [
    ...(byType.get(GAME_EVENT_TYPES.MATCH_IDENTIFIED) ?? []),
    ...snapshots.filter((event) => event.payload?.matchId)
  ];
  const matchIds = [...new Set(matchEvents.map((event) => event.payload?.matchId).filter(Boolean).map(String))];
  const players = byType.get(GAME_EVENT_TYPES.PLAYER_IDENTIFIED) ?? [];
  const heroes = [...new Set(players.map((event) => event.payload?.hero).filter(Boolean).map(String))];
  const phases = snapshots.map((event) => event.payload?.phase).filter(Boolean);
  if ((byType.get(GAME_EVENT_TYPES.MATCH_STARTED) ?? []).length) phases.push('playing');
  if ((byType.get(GAME_EVENT_TYPES.MATCH_ENDED) ?? []).length) phases.push('ended');

  const clocks = (byType.get(GAME_EVENT_TYPES.CLOCK_UPDATED) ?? [])
    .map((event) => Number(event.payload?.gameTimeSec ?? event.gameTimeSec))
    .filter(Number.isFinite);
  const clockSpan = clocks.length ? Math.max(...clocks) - Math.min(...clocks) : 0;
  const goldEvents = byType.get(GAME_EVENT_TYPES.GOLD_CHANGED) ?? [];
  const economyEvents = byType.get(GAME_EVENT_TYPES.ECONOMY_UPDATED) ?? [];
  const levelEvents = byType.get(GAME_EVENT_TYPES.HERO_LEVEL_CHANGED) ?? [];
  const vitalEvents = byType.get(GAME_EVENT_TYPES.HERO_VITALS_CHANGED) ?? [];
  const itemEvents = [
    ...(byType.get(GAME_EVENT_TYPES.ITEM_ADDED) ?? []),
    ...(byType.get(GAME_EVENT_TYPES.ITEM_REMOVED) ?? [])
  ];
  const requiredUnmapped = report.mappings.filter((mapping) => mapping.status === 'ignored' && CORE_REQUIRED_FEATURES.has(mapping.feature));
  const issueCodes = new Set(report.issues.map((issue) => issue.code));
  const release = profile === MATCH_VALIDATION_PROFILES.RELEASE;

  const signals = [
    signal('jsonl_integrity', 'JSONL parses without loss', true,
      report.recording.parseErrorCount === 0,
      { parseErrorCount: report.recording.parseErrorCount },
      report.recording.parseErrorCount ? 'Fix malformed JSONL lines before trusting the recording.' : 'All JSONL lines parsed.'),
    signal('envelope_integrity', 'Every envelope is structurally valid', true,
      report.summary.invalidEnvelopeCount === 0,
      { invalidEnvelopeCount: report.summary.invalidEnvelopeCount },
      report.summary.invalidEnvelopeCount ? 'Invalid envelopes were received.' : 'Envelope structure is valid.'),
    signal('feature_registration', 'Required GEP features are registered', true,
      featureRegistration.registrationEnvelopeCount > 0 && featureRegistration.missingRequiredFeatures.length === 0,
      featureRegistration,
      featureRegistration.registrationEnvelopeCount === 0
        ? 'No feature-registration status was captured; start recording before GEP activation.'
        : featureRegistration.missingRequiredFeatures.length
          ? `Required GEP features are unavailable: ${featureRegistration.missingRequiredFeatures.join(', ')}.`
          : 'The runtime reported no missing required features.'),
    signal('receipt_order', 'Transport timestamps remain monotonic', true,
      !issueCodes.has('OUT_OF_ORDER_RECEIPT'),
      { outOfOrderCount: report.issues.filter((issue) => issue.code === 'OUT_OF_ORDER_RECEIPT').length },
      issueCodes.has('OUT_OF_ORDER_RECEIPT') ? 'Out-of-order receipt timestamps were detected.' : 'Receipt order is monotonic.'),
    signal('match_identity', 'Match ID is observed', true,
      matchIds.length > 0,
      { matchIds },
      matchIds.length ? `${matchIds.length} match ID(s) observed.` : 'No match identity was mapped.'),
    signal('player_identity', 'Local hero is observed', true,
      heroes.length > 0,
      { heroes },
      heroes.length ? `Observed hero(s): ${heroes.join(', ')}.` : 'No local hero identity was mapped.'),
    signal('playing_phase', 'Playing phase is observed', true,
      phases.includes('playing'),
      { phases: [...new Set(phases)] },
      phases.includes('playing') ? 'The recording entered the playing phase.' : 'No reliable playing phase was observed.'),
    signal('clock_progression', 'Game clock progresses', true,
      clocks.length >= 2 && clockSpan >= 30,
      { count: clocks.length, min: clocks.length ? Math.min(...clocks) : null, max: clocks.length ? Math.max(...clocks) : null, spanSec: clockSpan },
      clocks.length >= 2 && clockSpan >= 30 ? 'Clock progression is usable.' : 'Need at least two clock samples spanning 30 seconds.'),
    signal('gold_updates', 'Gold updates are mapped', true,
      goldEvents.length >= 2 && goldEvents.every((event) => numeric(event.payload?.gold)),
      { count: goldEvents.length },
      goldEvents.length >= 2 ? 'Gold changed more than once.' : 'Need repeated gold updates.'),
    signal('gpm_updates', 'GPM is mapped', true,
      economyEvents.some((event) => numeric(event.payload?.gpm)),
      { count: economyEvents.filter((event) => numeric(event.payload?.gpm)).length },
      economyEvents.some((event) => numeric(event.payload?.gpm)) ? 'GPM is available.' : 'No numeric GPM update was mapped.'),
    signal('level_updates', 'Hero level changes are mapped', true,
      levelEvents.some((event) => numeric(event.payload?.level)),
      { count: levelEvents.length },
      levelEvents.length ? 'Hero level progression is available.' : 'No hero level update was mapped.'),
    signal('vitals_updates', 'Health and mana are mapped together', true,
      vitalEvents.some((event) => ['health', 'maxHealth', 'mana', 'maxMana'].every((key) => numeric(event.payload?.[key]))),
      { count: vitalEvents.length },
      vitalEvents.length ? 'Vital updates are available.' : 'No complete health/mana update was mapped.'),
    signal('inventory_updates', 'Inventory changes are mapped', true,
      itemEvents.length > 0,
      { count: itemEvents.length },
      itemEvents.length ? 'At least one inventory change was mapped.' : 'No inventory change was mapped; item timing cannot be trusted.'),
    signal('match_end', 'Match end is observed', true,
      (byType.get(GAME_EVENT_TYPES.MATCH_ENDED) ?? []).length > 0,
      { count: (byType.get(GAME_EVENT_TYPES.MATCH_ENDED) ?? []).length },
      (byType.get(GAME_EVENT_TYPES.MATCH_ENDED) ?? []).length ? 'Match end is present.' : 'No match end signal was mapped.'),
    signal('required_payload_mapping', 'Required payloads map canonically', true,
      requiredUnmapped.length === 0,
      { unmapped: requiredUnmapped.map((mapping) => ({ feature: mapping.feature, reason: mapping.reason })) },
      requiredUnmapped.length ? `${requiredUnmapped.length} required payload(s) were not mapped.` : 'All observed required payloads were mapped.'),
    signal('next_match_reset', 'A second match identity is observed', release,
      matchIds.length >= 2,
      { matchIds },
      matchIds.length >= 2 ? 'Cross-match reset can be validated.' : 'Record a second match without restarting the app.'),
    signal('death_respawn', 'Death and respawn path is observed', false,
      (byType.get(GAME_EVENT_TYPES.HERO_DIED) ?? []).length > 0
        && (byType.get(GAME_EVENT_TYPES.HERO_RESPAWNED) ?? []).length > 0,
      {
        deaths: (byType.get(GAME_EVENT_TYPES.HERO_DIED) ?? []).length,
        respawns: (byType.get(GAME_EVENT_TYPES.HERO_RESPAWNED) ?? []).length
      },
      'Optional combat lifecycle coverage.'),
    signal('draft_updates', 'Draft/roster is observed', false,
      (byType.get(GAME_EVENT_TYPES.DRAFT_UPDATED) ?? []).length > 0,
      { count: (byType.get(GAME_EVENT_TYPES.DRAFT_UPDATED) ?? []).length },
      'Optional draft coverage.'),
    signal('xpm_updates', 'XPM is mapped', false,
      economyEvents.some((event) => numeric(event.payload?.xpm)),
      { count: economyEvents.filter((event) => numeric(event.payload?.xpm)).length },
      'Optional economy coverage.')
  ];

  return { signals, matchIds, heroes, phases: [...new Set(phases)], events, byType };
}

function calibrationSummary(report, signalContext) {
  const { events } = signalContext;
  const itemAcquisitions = events
    .filter((event) => event.type === GAME_EVENT_TYPES.ITEM_ADDED)
    .map((event) => ({
      itemId: event.payload?.itemId ?? event.payload?.id ?? null,
      gameTimeSec: Number.isFinite(Number(event.gameTimeSec)) ? Number(event.gameTimeSec) : null
    }));
  const levelTimings = events
    .filter((event) => event.type === GAME_EVENT_TYPES.HERO_LEVEL_CHANGED)
    .map((event) => ({ level: event.payload?.level ?? null, gameTimeSec: Number.isFinite(Number(event.gameTimeSec)) ? Number(event.gameTimeSec) : null }));
  const decisions = [...report.pipeline.decisionHistory, {
    action: report.pipeline.decision.action,
    confidence: report.pipeline.decision.confidence,
    gameTimeSec: report.pipeline.state.gameTimeSec,
    reasons: report.pipeline.decision.reasons
  }];
  const confidences = decisions.map((entry) => Number(entry.confidence)).filter(Number.isFinite);
  const actionCounts = {};
  for (const entry of decisions) actionCounts[entry.action] = (actionCounts[entry.action] ?? 0) + 1;
  return {
    heroes: signalContext.heroes,
    matchIds: signalContext.matchIds,
    phases: signalContext.phases,
    maxGameTimeSec: Math.max(0, ...events.map((event) => Number(event.gameTimeSec)).filter(Number.isFinite)),
    itemAcquisitions,
    levelTimings,
    decisions: {
      transitionCount: report.pipeline.decisionHistory.length,
      actionCounts,
      confidence: {
        min: confidences.length ? Math.min(...confidences) : null,
        max: confidences.length ? Math.max(...confidences) : null,
        average: confidences.length ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length : null
      }
    }
  };
}

export function validateJsonlRecording(text, options = {}) {
  const profile = options.profile === MATCH_VALIDATION_PROFILES.RELEASE
    ? MATCH_VALIDATION_PROFILES.RELEASE
    : MATCH_VALIDATION_PROFILES.SINGLE_MATCH;
  const parsed = parseJsonl(text, options);
  const envelopes = parsed.records.map((record) => record.value);
  const diagnostics = diagnoseJsonlRecording(text, options);
  const featureRegistration = analyzeFeatureRegistration(envelopes);
  const context = analyzeSignals(diagnostics, profile, featureRegistration);
  const required = context.signals.filter((entry) => entry.required);
  const requiredPassed = required.filter((entry) => entry.pass).length;
  const blockers = required.filter((entry) => !entry.pass);
  const warnings = context.signals.filter((entry) => !entry.required && !entry.pass);
  const status = blockers.length ? 'BLOCKED' : warnings.length ? 'PASS_WITH_WARNINGS' : 'PASS';

  return {
    schemaVersion: 1,
    profile,
    status,
    score: required.length ? requiredPassed / required.length : 0,
    summary: {
      requiredSignalCount: required.length,
      passedRequiredSignalCount: requiredPassed,
      blockerCount: blockers.length,
      warningCount: warnings.length,
      matchCount: context.matchIds.length,
      heroCount: context.heroes.length
    },
    signals: context.signals,
    blockers,
    warnings,
    contracts: inferGepPayloadContracts(envelopes),
    calibration: calibrationSummary(diagnostics, context),
    diagnostics
  };
}

export function validateRecordingSuite(recordings = [], options = {}) {
  const minRecordings = Math.max(1, Number(options.minRecordings) || 5);
  const reports = recordings.map((recording, index) => {
    if (recording?.validationReport) return recording.validationReport;
    const name = recording?.name ?? `recording-${index + 1}.jsonl`;
    const text = recording?.text ?? String(recording ?? '');
    return { name, ...validateJsonlRecording(text, { ...options, profile: MATCH_VALIDATION_PROFILES.SINGLE_MATCH }) };
  });
  const passing = reports.filter((report) => report.status !== 'BLOCKED');
  const blocked = reports.filter((report) => report.status === 'BLOCKED');
  const signalIds = [...new Set(reports.flatMap((report) => report.signals.map((entry) => entry.id)))];
  const signalCoverage = signalIds.map((id) => ({
    id,
    passedRecordings: reports.filter((report) => report.signals.find((entry) => entry.id === id)?.pass).length,
    totalRecordings: reports.length
  }));
  const resetValidated = reports.some((report) => report.signals.find((entry) => entry.id === 'next_match_reset')?.pass);
  const enoughRecordings = reports.length >= minRecordings;
  const ready = enoughRecordings && blocked.length === 0 && resetValidated;
  const status = ready ? 'READY' : blocked.length ? 'BLOCKED' : 'COLLECTING';

  return {
    schemaVersion: 1,
    status,
    minRecordings,
    summary: {
      recordingCount: reports.length,
      passingRecordingCount: passing.length,
      blockedRecordingCount: blocked.length,
      remainingRecordingCount: Math.max(0, minRecordings - reports.length),
      resetValidated,
      heroes: [...new Set(reports.flatMap((report) => report.calibration.heroes))],
      matchIds: [...new Set(reports.flatMap((report) => report.calibration.matchIds))]
    },
    signalCoverage,
    reports
  };
}
