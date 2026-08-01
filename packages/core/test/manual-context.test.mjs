import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LIVE_BRIDGE_STATES,
  MANUAL_CONTEXT_COMMANDS,
  ROLE_ACTIONS,
  ROLE_SIGNAL_STATUS,
  LiveGepBridge,
  createManualContextEnvelope,
  diagnoseGepEnvelopes,
  parseJsonl,
  serializeJsonl
} from '../src/index.mjs';

function midBridge(gameTimeSec = 345) {
  return new LiveGepBridge({
    initialState: {
      phase: 'playing',
      hero: 'queen_of_pain',
      role: 'mid',
      gameTimeSec,
      health: 900,
      maxHealth: 1000,
      mana: 700,
      maxMana: 800
    },
    coordinatorOptions: { minimumHoldSec: 0, switchMargin: 0, role: { minimumHoldSec: 0 } }
  });
}

test('manual lane confirmation unlocks a concrete power-rune decision without faking GEP connectivity', () => {
  const bridge = midBridge(345);
  const snapshot = bridge.ingestManualContext(MANUAL_CONTEXT_COMMANDS.LANE_PUSHED, { receivedAt: 1000 });

  assert.equal(snapshot.bridge.state, LIVE_BRIDGE_STATES.WAITING);
  assert.equal(snapshot.bridge.forwardedEnvelopeCount, 0);
  assert.equal(snapshot.bridge.manualEnvelopeCount, 1);
  assert.equal(snapshot.diagnostics.pipeline.state.roleContext.meta.signals.laneState.status, ROLE_SIGNAL_STATUS.MANUAL);
  assert.equal(snapshot.diagnostics.pipeline.roleDecision.action, ROLE_ACTIONS.CONTROL_POWER_RUNE);
  assert.ok(snapshot.bridgeEvents.some((event) => event.code === 'MANUAL_CONTEXT_APPLIED'));
});

test('bottled DD plus expected Wisdom fight produces the planned hold-rune advice', () => {
  const bridge = midBridge(370);
  bridge.ingestManualContext(MANUAL_CONTEXT_COMMANDS.BOTTLE_DOUBLE_DAMAGE, { receivedAt: 1000 });
  const snapshot = bridge.ingestManualContext(MANUAL_CONTEXT_COMMANDS.WISDOM_FIGHT_EXPECTED, { receivedAt: 1001 });

  assert.equal(snapshot.diagnostics.pipeline.roleDecision.action, ROLE_ACTIONS.HOLD_RUNE_FOR_WISDOM);
  assert.equal(snapshot.diagnostics.pipeline.state.roleContext.bottledRune.type, 'double_damage');
  assert.equal(snapshot.diagnostics.pipeline.state.roleContext.meta.signals.bottledRune.status, ROLE_SIGNAL_STATUS.MANUAL);
});

test('clear command removes manual proof and restores the safe timer-only fallback', () => {
  const bridge = midBridge(345);
  bridge.ingestManualContext(MANUAL_CONTEXT_COMMANDS.LANE_PUSHED, { receivedAt: 1000 });
  const snapshot = bridge.ingestManualContext(MANUAL_CONTEXT_COMMANDS.CLEAR, { receivedAt: 1001 });

  assert.equal(snapshot.diagnostics.pipeline.roleDecision.action, ROLE_ACTIONS.PREPARE_POWER_RUNE);
  assert.equal(snapshot.diagnostics.pipeline.state.roleContext.meta.signals.laneState.status, ROLE_SIGNAL_STATUS.UNAVAILABLE);
});

test('manual context envelopes survive JSONL capture and deterministic replay', () => {
  const envelopes = [
    createManualContextEnvelope(MANUAL_CONTEXT_COMMANDS.ROUTE_SAFE, { receivedAt: 1000, gameTimeSec: 500, sourceSequence: 'manual-1' }),
    createManualContextEnvelope(MANUAL_CONTEXT_COMMANDS.TARGET_BOTTOM, { receivedAt: 1001, gameTimeSec: 500, sourceSequence: 'manual-2' })
  ];
  const parsed = parseJsonl(serializeJsonl(envelopes));
  const report = diagnoseGepEnvelopes(parsed.records.map((record) => record.value), {
    initialState: { phase: 'playing', role: 'soft_support', gameTimeSec: 500 },
    coordinatorOptions: { minimumHoldSec: 0, switchMargin: 0, role: { minimumHoldSec: 0 } }
  });

  assert.equal(report.summary.envelopeTypeCounts['manual-context'], 2);
  assert.equal(report.summary.canonicalEventCount, 2);
  assert.equal(report.pipeline.state.roleContext.safeMoveAvailable, true);
  assert.equal(report.pipeline.state.roleContext.lanes.bottom.killPotential, 0.82);
});
