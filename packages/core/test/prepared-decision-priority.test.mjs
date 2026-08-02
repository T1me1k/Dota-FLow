import test from 'node:test';
import assert from 'node:assert/strict';
import { orchestrateDecision } from '../src/decision-orchestrator.mjs';

test('prepared Roshan call is rescored after urgency downgrade and cannot hide critical RESET', () => {
  const call = orchestrateDecision({
    state: { phase: 'playing', gameTimeSec: 817, alive: true, health: 1000, maxHealth: 1200 },
    dataQuality: { overall: 'INFERRED', objective: 'INFERRED', macro: 'INFERRED' },
    objectiveDecision: {
      action: 'TAKE_ROSHAN',
      confidence: 0.57,
      urgency: 'HIGH',
      missingSignals: ['vision', 'readiness'],
      reasons: ['Objective window is open']
    },
    macroDecision: {
      action: 'RESET',
      confidence: 0.52,
      urgency: 'CRITICAL',
      reasons: ['Spend uncommitted gold before the next move']
    }
  });

  assert.equal(call.primaryAction, 'RESET');
  assert.equal(call.primaryDomain, 'MACRO');
  assert.equal(call.urgency, 'CRITICAL');
  assert.ok(call.suppressedActions.some((entry) => entry.action === 'PREPARE_ROSHAN'));
});
