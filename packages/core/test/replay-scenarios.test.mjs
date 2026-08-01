import test from 'node:test';
import assert from 'node:assert/strict';
import { listReplayScenarios, runReplaySuite } from '../src/replay-calibration.mjs';

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
