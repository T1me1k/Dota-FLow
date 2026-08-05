import test from 'node:test';
import assert from 'node:assert/strict';
import { listReplayScenarios, runReplaySuite, stableCoachCall } from '../src/replay-calibration.mjs';

test('localized coaching reasons do not replace stable machine reason codes', () => {
  const stable = stableCoachCall({
    primaryAction: 'PROTECT_CORE',
    primaryDomain: 'LANE',
    urgency: 'CRITICAL',
    reasons: ['Сохраняй ресурсы core и безопасную дистанцию'],
    missingSignals: [],
    dataQuality: 'INFERRED',
    secondaryActions: []
  });
  assert.deepEqual(stable.reasonCodes, ['CORE']);
});

test('all 30 replay scenarios and 90 checkpoints pass', async () => {
  const scenarios = await listReplayScenarios();
  const suite = await runReplaySuite();
  const failures = suite.results
    .filter((result) => !result.passed)
    .map((result) => ({
      scenarioId: result.scenarioId,
      checkpoints: result.checkpointResults
        .filter((checkpoint) => !checkpoint.passed)
        .map((checkpoint) => ({
          gameTimeSec: checkpoint.gameTimeSec,
          expectedPrimaryAction: checkpoint.expected.expectedPrimaryAction,
          allowedAlternativeActions: checkpoint.expected.allowedAlternativeActions ?? [],
          expectedUrgency: checkpoint.expected.expectedUrgency ?? null,
          requiredReasonCodes: checkpoint.expected.requiredReasonCodes ?? [],
          actual: checkpoint.actual,
          forbiddenViolations: checkpoint.forbiddenViolations
        }))
    }));

  assert.equal(scenarios.length, 30);
  assert.equal(suite.summary.checkpoints, 90);
  assert.equal(suite.summary.failed, 0, JSON.stringify(failures, null, 2));
  assert.equal(suite.summary.replayCompletionRate, 1);
});

test('confirmed resource recovery releases a stale critical reset', async () => {
  const suite = await runReplaySuite({ id: 'safety-03-crystal_maiden' });
  const result = suite.results[0];
  const lowHealthEntry = result.timeline.filter((entry) => entry.gameTimeSec <= 1211).at(-1);
  const recoveredEntry = result.timeline.filter((entry) => entry.gameTimeSec <= 1523).at(-1);
  const checkpoint = result.checkpointResults.find((entry) => entry.gameTimeSec === 1523);

  assert.ok(['RESET', 'RESET_BEFORE_OBJECTIVE'].includes(lowHealthEntry.call.primaryAction));
  assert.equal(lowHealthEntry.call.urgency, 'CRITICAL');
  assert.ok(lowHealthEntry.healthPct <= 0.22);

  assert.ok(recoveredEntry.healthPct >= 0.5);
  assert.equal(recoveredEntry.objectiveWindow, true);
  assert.equal(checkpoint.actual.primaryAction, 'PREPARE_ROSHAN');
  assert.equal(checkpoint.actual.urgency, 'MEDIUM');
  assert.equal(checkpoint.lifecycleCorrection, 'CONFIRMED_RESOURCE_RECOVERY');
  assert.equal(checkpoint.passed, true);
});
