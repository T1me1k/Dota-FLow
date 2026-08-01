import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DecisionOverlayController,
  LIVE_BRIDGE_STATES,
  MACRO_ACTIONS,
  OVERLAY_MODES,
  OVERLAY_VIEW_STATES,
  deriveDecisionOverlayModel
} from '../src/index.mjs';

function makeSnapshot({
  bridgeState = LIVE_BRIDGE_STATES.LIVE,
  phase = 'playing',
  action = MACRO_ACTIONS.FARM,
  confidence = 0.8,
  gameTimeSec = 720,
  state = {},
  decision = {}
} = {}) {
  return {
    bridge: {
      state: bridgeState,
      message: bridgeState === LIVE_BRIDGE_STATES.LIVE ? 'Receiving GEP data' : 'Connection warning',
      activeMatchId: 'match-1'
    },
    diagnostics: {
      pipeline: {
        state: {
          matchId: 'match-1',
          phase,
          hero: 'luna',
          gameTimeSec,
          alive: true,
          health: 900,
          maxHealth: 1200,
          gold: 1200,
          targetItem: {
            id: 'item_manta',
            name: 'Manta Style',
            totalCost: 4650,
            ownedValue: 2200
          },
          ...state
        },
        decision: {
          action,
          headline: action,
          message: `Decision ${action}`,
          confidence,
          reasons: ['Power spike active', 'Enemy core is dead'],
          powerState: {
            status: 'ACTIVE',
            primarySpike: { label: 'Manta Style timing' }
          },
          ...decision
        }
      }
    }
  };
}

test('overlay stays hidden while waiting or outside an active match', () => {
  const waiting = deriveDecisionOverlayModel(makeSnapshot({ bridgeState: LIVE_BRIDGE_STATES.WAITING }));
  assert.equal(waiting.visible, false);
  assert.equal(waiting.hiddenReason, 'CONNECTION_WAITING');

  const ended = deriveDecisionOverlayModel(makeSnapshot({ phase: 'ended' }));
  assert.equal(ended.visible, false);
  assert.equal(ended.hiddenReason, 'MATCH_NOT_ACTIVE');
});

test('compact live decision exposes only the highest priority reason', () => {
  const model = deriveDecisionOverlayModel(makeSnapshot(), {
    settings: { mode: OVERLAY_MODES.COMPACT, reasonLimit: 3 }
  });

  assert.equal(model.visible, true);
  assert.equal(model.viewState, OVERLAY_VIEW_STATES.DECISION);
  assert.equal(model.action, MACRO_ACTIONS.FARM);
  assert.equal(model.label, 'ФАРМ');
  assert.equal(model.gameClock, '12:00');
  assert.equal(model.targetRemainingGold, 1250);
  assert.deepEqual(model.reasons, ['Power spike active']);
  assert.equal(model.spikeLabel, 'Manta Style timing');
});

test('reset is presented as the highest priority action', () => {
  const model = deriveDecisionOverlayModel(makeSnapshot({
    action: MACRO_ACTIONS.RESET,
    confidence: 0.96,
    state: { health: 120, maxHealth: 1200 }
  }));

  assert.equal(model.priority, 100);
  assert.equal(model.tone, 'reset');
  assert.equal(model.healthPct, 0.1);
  assert.equal(model.label, 'ОТОЙДИ');
});

test('stale connection replaces a potentially unsafe old decision', () => {
  const model = deriveDecisionOverlayModel(makeSnapshot({ bridgeState: LIVE_BRIDGE_STATES.STALE }));
  assert.equal(model.visible, true);
  assert.equal(model.viewState, OVERLAY_VIEW_STATES.STALE);
  assert.equal(model.action, null);
  assert.equal(model.statusLabel, 'ДАННЫЕ УСТАРЕЛИ');
});

test('low-confidence decisions can be shown as uncertain or hidden by settings', () => {
  const snapshot = makeSnapshot({ confidence: 0.25 });
  const visible = deriveDecisionOverlayModel(snapshot, { settings: { minConfidence: 0.5 } });
  assert.equal(visible.viewState, OVERLAY_VIEW_STATES.LOW_CONFIDENCE);
  assert.equal(visible.lowConfidence, true);

  const hidden = deriveDecisionOverlayModel(snapshot, {
    settings: { minConfidence: 0.5, hideLowConfidence: true }
  });
  assert.equal(hidden.visible, false);
  assert.equal(hidden.hiddenReason, 'LOW_CONFIDENCE');
});

test('controller pulses only when a real macro action changes', () => {
  let now = 1000;
  const controller = new DecisionOverlayController({ now: () => now, settings: { changePulseMs: 2000 } });

  const first = controller.ingest(makeSnapshot({ action: MACRO_ACTIONS.FARM }), now);
  assert.equal(first.changed, false);

  now = 1500;
  const changed = controller.ingest(makeSnapshot({ action: MACRO_ACTIONS.FIGHT }), now);
  assert.equal(changed.changed, true);
  assert.equal(changed.action, MACRO_ACTIONS.FIGHT);

  now = 3600;
  assert.equal(controller.snapshot(now).changed, false);
});

test('degraded live connection keeps the decision but marks it clearly', () => {
  const model = deriveDecisionOverlayModel(makeSnapshot({ bridgeState: LIVE_BRIDGE_STATES.DEGRADED }));
  assert.equal(model.visible, true);
  assert.equal(model.viewState, OVERLAY_VIEW_STATES.DEGRADED);
  assert.equal(model.degraded, true);
  assert.equal(model.action, MACRO_ACTIONS.FARM);
});

test('bundled live stream produces a usable final decision overlay', async () => {
  const { readFile } = await import('node:fs/promises');
  const { parseJsonl, LiveGepBridge } = await import('../src/index.mjs');
  const text = await readFile(new URL('../../../fixtures/recordings/live-bridge-session.jsonl', import.meta.url), 'utf8');
  const parsed = parseJsonl(text);
  const bridge = new LiveGepBridge({
    coordinatorOptions: { minimumHoldSec: 0, switchMargin: 0 }
  });
  const controller = new DecisionOverlayController();
  let model;
  for (const record of parsed.records) {
    model = controller.ingest(bridge.ingestEnvelope(record.value), record.value.receivedAt);
  }

  assert.equal(model.visible, true);
  assert.equal(model.matchId, 'live-match-b');
  assert.equal(model.action, MACRO_ACTIONS.FARM);
  assert.equal(model.connectionState, LIVE_BRIDGE_STATES.LIVE);
});

test('new match starts without a false action-change pulse', () => {
  let now = 1000;
  const controller = new DecisionOverlayController({ now: () => now });
  controller.ingest(makeSnapshot({ action: MACRO_ACTIONS.FARM }), now);

  now = 2000;
  const nextMatch = makeSnapshot({ action: MACRO_ACTIONS.FIGHT });
  nextMatch.bridge.activeMatchId = 'match-2';
  nextMatch.diagnostics.pipeline.state.matchId = 'match-2';
  const model = controller.ingest(nextMatch, now);

  assert.equal(model.action, MACRO_ACTIONS.FIGHT);
  assert.equal(model.changed, false);
});

test('stale warning does not appear after the match has ended', () => {
  const model = deriveDecisionOverlayModel(makeSnapshot({
    bridgeState: LIVE_BRIDGE_STATES.STALE,
    phase: 'ended'
  }));
  assert.equal(model.visible, false);
  assert.equal(model.hiddenReason, 'MATCH_NOT_ACTIVE');
});

test('baseline hero decisions remain visibly marked and do not pretend the build is complete', () => {
  const bridge = makeSnapshot({
    state: { hero: 'largo', targetItem: null },
    decision: {
      profile: { id: 'largo', calibrationTier: 'BASELINE', profileTemplate: 'support' },
      powerState: { status: 'ACTIVE', calibrationTier: 'BASELINE', profileTemplate: 'support' }
    }
  });
  const model = deriveDecisionOverlayModel(bridge, { now: 2000 });

  assert.equal(model.visible, true);
  assert.equal(model.baselineProfile, true);
  assert.equal(model.calibrationTier, 'BASELINE');
  assert.equal(model.targetItem, null);
});
