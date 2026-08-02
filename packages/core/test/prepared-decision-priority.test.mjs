import test from 'node:test';
import assert from 'node:assert/strict';
import { orchestrateDecision } from '../src/decision-orchestrator.mjs';

test('prepared Roshan call is rescored and cannot hide a generic critical RESET on a prototype hero', () => {
  const call = orchestrateDecision({
    state: { phase: 'playing', gameTimeSec: 817, alive: true, health: 1000, maxHealth: 1200 },
    dataQuality: { overall: 'INFERRED', objective: 'INFERRED', macro: 'UNKNOWN' },
    objectiveDecision: {
      action: 'TAKE_ROSHAN',
      confidence: 0.57,
      urgency: 'HIGH',
      missingSignals: ['vision', 'readiness'],
      reasons: ['Objective window is open']
    },
    macroDecision: {
      action: 'RESET',
      confidence: 0.5196571428571428,
      reasons: ['Много золота — выгодно купить предметы', 'Карта сейчас опасна'],
      profile: { calibrationVersion: 'prototype-7.41-faceless-void-conservative-v2' },
      powerState: { permanentSpikes: [] }
    }
  });

  assert.equal(call.primaryAction, 'RESET');
  assert.equal(call.primaryDomain, 'MACRO');
  assert.equal(call.urgency, 'CRITICAL');
  assert.ok(call.confidence >= 0.55);
  assert.ok(call.suppressedActions.some((entry) => entry.action === 'PREPARE_ROSHAN'));
});
