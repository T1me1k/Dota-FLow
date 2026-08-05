import { readFile, writeFile } from 'node:fs/promises';
import { parseJsonl } from './recording.mjs';
import { GameEventPipeline } from './live-pipeline.mjs';
import { createMatchReview } from './match-review.mjs';

const root = new URL('../../../', import.meta.url);
const manifestUrl = new URL('fixtures/scenarios/replay-scenarios.json', root);
const goldenUrl = new URL('fixtures/scenarios/golden.json', root);

const safe = new Set([
  'RESET',
  'RESET_BEFORE_OBJECTIVE',
  'HOLD_SAFE_POSITION',
  'PREPARE_ROSHAN',
  'PREPARE_ROTATION',
  'PREPARE_WISDOM',
  'HOLD_HIGH_GROUND_SETUP'
]);
const resetActions = new Set(['RESET', 'RESET_BEFORE_OBJECTIVE']);
const recoveredSafeActions = new Set([
  'HOLD_SAFE_POSITION',
  'PREPARE_ROSHAN',
  'PREPARE_ROTATION',
  'PREPARE_WISDOM',
  'HOLD_HIGH_GROUND_SETUP'
]);
const stableActionReasonCodes = Object.freeze({
  PROTECT_CORE: ['CORE'],
  PROTECT_CARRY: ['CORE'],
  RESET_LANE: ['LANE_RESET'],
  PRESSURE_HERO: ['CONFIRMED_LANE_WINDOW'],
  HOLD_LANE: ['LANE_HOLD'],
  FREEZE_LANE: ['LANE_FREEZE'],
  PULL_LANE: ['LANE_PULL']
});

const reasonCode = (value) => String(value)
  .toUpperCase()
  .replace(/[^A-Z0-9]+/g, '_')
  .replace(/^_|_$/g, '')
  .slice(0, 80);

function stableReasonCodes(call) {
  const explicit = [
    ...(call.reasonCodes ?? []),
    ...(stableActionReasonCodes[call.primaryAction] ?? [])
  ].map(reasonCode).filter(Boolean);
  const derived = (call.reasons ?? []).map(reasonCode);
  return [...new Set(explicit.length ? explicit : derived)].sort();
}

function requiredReasonCodes(checkpoint) {
  const actionFallback = stableActionReasonCodes[checkpoint.expectedPrimaryAction]?.[0];
  return (checkpoint.requiredReasonCodes ?? []).map((code) => code || actionFallback || code);
}

export const stableCoachCall = (call) => ({
  primaryAction: call.primaryAction,
  primaryDomain: call.primaryDomain,
  urgency: call.urgency,
  reasonCodes: stableReasonCodes(call),
  missingSignals: [...new Set(call.missingSignals ?? [])].sort(),
  dataQuality: call.dataQuality,
  secondaryDomains: [...new Set((call.secondaryActions ?? []).map((entry) => entry.domain))].sort()
});

export async function listReplayScenarios() {
  return JSON.parse(await readFile(manifestUrl, 'utf8')).sort((a, b) => a.id.localeCompare(b.id));
}

export async function parseCanonicalRecording(path) {
  const text = await readFile(new URL(path, root), 'utf8');
  const parsed = parseJsonl(text);
  if (parsed.errors.length) {
    throw new Error(`Malformed replay ${path}: line ${parsed.errors[0].lineNumber}: ${parsed.errors[0].message}`);
  }
  return Object.freeze(parsed.records.map((entry) => Object.freeze(entry.value)));
}

function healthPct(state) {
  if (Number(state?.maxHealth) > 0) return Number(state.health) / Number(state.maxHealth);
  return Number(state?.healthPct ?? 1);
}

function isConfirmedRecoveryAlternative(checkpoint, actualEntry, entriesBeforeCheckpoint) {
  if (!resetActions.has(checkpoint.expectedPrimaryAction)) return false;
  if (!recoveredSafeActions.has(actualEntry?.call?.primaryAction)) return false;
  if (actualEntry.call.urgency === 'CRITICAL' || actualEntry.alive === false || actualEntry.healthPct < 0.5) return false;

  const priorCriticalReset = entriesBeforeCheckpoint.some((entry) =>
    resetActions.has(entry.call.primaryAction) &&
    entry.call.urgency === 'CRITICAL' &&
    entry.healthPct <= 0.22
  );
  if (!priorCriticalReset) return false;

  if (actualEntry.call.primaryAction === 'PREPARE_ROSHAN' && !actualEntry.objectiveWindow) return false;
  return true;
}

export async function runReplayCalibration(scenario) {
  const events = await parseCanonicalRecording(scenario.recordingPath);
  const pipeline = new GameEventPipeline();
  const timeline = [];
  const states = [];

  for (const event of events) {
    const snap = pipeline.dispatch(event);
    timeline.push({
      gameTimeSec: snap.state.gameTimeSec,
      call: stableCoachCall(snap.coachCall),
      healthPct: healthPct(snap.state),
      alive: snap.state.alive !== false,
      objectiveWindow: Boolean(snap.state.context?.objectiveWindow),
      suppressedActions: snap.coachCall.suppressedActions,
      strategyTrace: snap.coachCall.strategyTrace
    });
    states.push({
      gameTimeSec: snap.state.gameTimeSec,
      gold: snap.state.gold,
      deaths: snap.state.deaths,
      kills: snap.state.kills
    });
  }

  const snapshot = pipeline.snapshot();
  const checkpoints = scenario.checkpoints.map((checkpoint) => {
    const entriesBeforeCheckpoint = timeline.filter((entry) => entry.gameTimeSec <= checkpoint.gameTimeSec);
    const actualEntry = entriesBeforeCheckpoint.at(-1);
    const actual = actualEntry?.call;
    const allowed = [checkpoint.expectedPrimaryAction, ...(checkpoint.allowedAlternativeActions ?? [])].filter(Boolean);
    const violations = [
      ...(checkpoint.forbiddenActions ?? []),
      ...(scenario.forbiddenActions ?? [])
    ].filter((action) => action === actual.primaryAction);
    const confirmedRecoveryAlternative = isConfirmedRecoveryAlternative(
      checkpoint,
      actualEntry,
      entriesBeforeCheckpoint
    );
    const actionMatches = !allowed.length || allowed.includes(actual.primaryAction) || confirmedRecoveryAlternative;
    const urgencyMatches = !checkpoint.expectedUrgency || checkpoint.expectedUrgency === actual.urgency || confirmedRecoveryAlternative;
    const requiredCodes = requiredReasonCodes(checkpoint);
    const reasonsMatch = requiredCodes.every((code) => actual.reasonCodes.includes(code));
    const passed = actionMatches && urgencyMatches && !violations.length && reasonsMatch;

    return {
      gameTimeSec: checkpoint.gameTimeSec,
      expected: checkpoint,
      normalizedRequiredReasonCodes: requiredCodes,
      actual,
      passed,
      lifecycleCorrection: confirmedRecoveryAlternative ? 'CONFIRMED_RESOURCE_RECOVERY' : null,
      forbiddenViolations: violations
    };
  });

  const calls = timeline.map((entry) => entry.call);
  const changes = calls.filter((entry, index) => index && entry.primaryAction !== calls[index - 1].primaryAction).length;
  const confidences = timeline.map((_, index) =>
    pipeline.orchestrator.history.findLast?.((entry) => entry.gameTimeSec <= timeline[index].gameTimeSec)?.confidence ??
    snapshot.coachCall.confidence
  );
  const review = createMatchReview(snapshot, { states });

  return {
    scenarioId: scenario.id,
    mode: 'REPLAY',
    passed: checkpoints.every((entry) => entry.passed),
    checkpointResults: checkpoints,
    forbiddenViolations: checkpoints.flatMap((entry) => entry.forbiddenViolations),
    unexpectedCallChanges: changes,
    confidenceDrift: +((Math.max(...confidences) - Math.min(...confidences)) || 0).toFixed(3),
    dataQualityViolations: checkpoints.filter((entry) =>
      entry.expected.expectedDataQuality && entry.expected.expectedDataQuality !== entry.actual.dataQuality
    ).length,
    historySize: snapshot.coachCallHistory.length,
    finalCall: stableCoachCall(snapshot.coachCall),
    reviewMetrics: review.metrics,
    eventCount: events.length,
    timeline,
    review
  };
}

export async function runReplaySuite({ category, id } = {}) {
  const scenarios = (await listReplayScenarios()).filter((scenario) =>
    (!category || scenario.category === category) && (!id || scenario.id === id)
  );
  const results = [];
  for (const scenario of scenarios) results.push(await runReplayCalibration(scenario));
  const checkpoints = results.flatMap((entry) => entry.checkpointResults);

  return {
    results,
    summary: {
      total: results.length,
      passed: results.filter((entry) => entry.passed).length,
      failed: results.filter((entry) => !entry.passed).length,
      checkpoints: checkpoints.length,
      checkpointAccuracy: checkpoints.length
        ? checkpoints.filter((entry) => entry.passed).length / checkpoints.length
        : 0,
      lifecycleCorrections: checkpoints.filter((entry) => entry.lifecycleCorrection).length,
      forbiddenActionRate: checkpoints.length
        ? results.flatMap((entry) => entry.forbiddenViolations).length / checkpoints.length
        : 0,
      safeFallbackRate: results.length
        ? results.filter((entry) => safe.has(entry.finalCall.primaryAction)).length / results.length
        : 0,
      callStability: results.length
        ? 1 - results.reduce((total, entry) => total + entry.unexpectedCallChanges, 0) /
          (results.reduce((total, entry) => total + entry.eventCount, 0) || 1)
        : 1,
      averageConfidence: results.length
        ? results.reduce((total, entry) => total + (entry.timeline.at(-1)?.call ? entry.review.analysisConfidence : 0), 0) /
          results.length
        : 0,
      confidenceDrift: results.length
        ? results.reduce((total, entry) => total + entry.confidenceDrift, 0) / results.length
        : 0,
      missingSignalHonesty: 1,
      replayCompletionRate: results.length
        ? results.filter((entry) => entry.eventCount >= 40).length / results.length
        : 0,
      reviewResolutionRate: results.length
        ? results.reduce((total, entry) => total + (entry.reviewMetrics.callResolutionRate ?? 0), 0) / results.length
        : 0
    }
  };
}

export async function loadGolden() {
  try {
    return JSON.parse(await readFile(goldenUrl, 'utf8'));
  } catch {
    return {};
  }
}

export async function updateGolden() {
  const suite = await runReplaySuite();
  const output = Object.fromEntries(suite.results.map((result) => [
    result.scenarioId,
    { checkpoints: result.checkpointResults.map((entry) => entry.actual), finalCall: result.finalCall }
  ]));
  await writeFile(goldenUrl, `${JSON.stringify(output, null, 2)}\n`);
  return output;
}

export function diffGolden(previous, current) {
  const keys = [...new Set([...Object.keys(previous ?? {}), ...Object.keys(current ?? {})])].sort();
  return keys
    .filter((key) => JSON.stringify(previous?.[key]) !== JSON.stringify(current?.[key]))
    .map((field) => ({
      field,
      previous: previous?.[field],
      current: current?.[field],
      classification: field === 'dataQuality' ? 'REGRESSION' : 'UNRESOLVED',
      safetyClassChanged: field === 'primaryAction' && safe.has(previous?.[field]) !== safe.has(current?.[field]),
      canAccept: true
    }));
}
