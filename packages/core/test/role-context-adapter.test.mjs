import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GAME_EVENT_TYPES,
  GepDiagnosticSession,
  ROLE_ACTIONS,
  ROLE_SIGNAL_STATUS,
  GameEventPipeline,
  createInitialGameState,
  evaluateRoleDecision,
  roleContextSummary,
  roleSignalAvailable,
  toCanonicalGameEvents,
  toCanonicalInfoEvents
} from '../src/index.mjs';

test('status capabilities mark unavailable role signals instead of inventing them', () => {
  const session = new GepDiagnosticSession();
  const snapshot = session.ingestEnvelope({
    type: 'status',
    receivedAt: 1000,
    payload: {
      features: ['clock_time_changed', 'gold', 'gpm', 'roster', 'me'],
      supportedFeatures: ['clock_time_changed', 'gold', 'gpm', 'roster', 'me'],
      missingFeatures: ['hero_item_changed']
    }
  });
  const signals = snapshot.pipeline.state.roleContext.meta.signals;
  assert.equal(signals.laneState.status, ROLE_SIGNAL_STATUS.UNAVAILABLE);
  assert.equal(signals.enemyEconomy.status, ROLE_SIGNAL_STATUS.UNAVAILABLE);
  assert.equal(signals.bottledRune.status, ROLE_SIGNAL_STATUS.UNAVAILABLE);
  assert.equal(signals.ownInventory.status, ROLE_SIGNAL_STATUS.UNAVAILABLE);
});

test('official me and roster payloads identify the local player role', () => {
  const pipeline = new GameEventPipeline();
  pipeline.dispatchMany(toCanonicalInfoEvents({ feature: 'me', category: 'me', key: 'steam_id', value: '76561190000000001' }));
  pipeline.dispatchMany(toCanonicalInfoEvents({ feature: 'me', category: 'me', key: 'hero', value: 'queenofpain' }));
  pipeline.dispatchMany(toCanonicalInfoEvents({
    feature: 'roster',
    category: 'roster',
    key: 'players',
    value: JSON.stringify([
      { steamId: '76561190000000001', hero: 'queenofpain', team: 2, role: 2 },
      { steamId: '76561190000000002', hero: 'juggernaut', team: 2, role: 1 },
      { steamId: '76561190000000003', hero: 'axe', team: 3, role: 4 }
    ])
  }));
  assert.equal(pipeline.state.steamId, '76561190000000001');
  assert.equal(pipeline.state.role, 'mid');
  assert.equal(pipeline.state.roster.length, 3);
  assert.equal(pipeline.state.roleContext.meta.signals.playerRole.status, ROLE_SIGNAL_STATUS.LIVE);
});

test('official combat, ability and ward events populate live telemetry', () => {
  const pipeline = new GameEventPipeline({ initialState: { phase: 'playing', gameTimeSec: 350, hero: 'shadow_fiend', role: 'mid' } });
  pipeline.dispatchMany(toCanonicalGameEvents({ events: [
    { name: 'clock_time_changed', data: '{"clock_time":351}' },
    { name: 'cs', data: '{"last_hits":42,"denies":8}' },
    { name: 'hero_ability_cooldown_changed', data: '{"slot":3,"name":"nevermore_requiem","level":1,"can_cast":true,"cooldown":0,"ultimate":true}' },
    { name: 'ward_purchase_cooldown_changed', data: '{"ward_purchase_cooldown":75}' }
  ] }));
  assert.equal(pipeline.state.lastHits, 42);
  assert.equal(pipeline.state.denies, 8);
  assert.equal(pipeline.state.ultimateReady, true);
  assert.equal(pipeline.state.wardPurchaseCooldownSec, 75);
  assert.equal(pipeline.state.roleContext.meta.signals.combatStats.status, ROLE_SIGNAL_STATUS.LIVE);
  assert.equal(pipeline.state.roleContext.meta.signals.ownAbilities.status, ROLE_SIGNAL_STATUS.LIVE);
});

test('timer-only live data prepares Wisdom but blocks an unverified map move', () => {
  const pipeline = new GameEventPipeline({ initialState: {
    phase: 'playing', hero: 'axe', role: 'offlane', gameTimeSec: 385,
    health: 1000, maxHealth: 1000, mana: 500, maxMana: 500
  }});
  pipeline.dispatch({
    type: GAME_EVENT_TYPES.ROLE_CONTEXT_CAPABILITIES_UPDATED,
    source: 'gep',
    payload: { supportedFeatures: ['clock_time_changed', 'hero_health_mana_info'], missingFeatures: [] }
  });
  pipeline.dispatch({ type: GAME_EVENT_TYPES.CLOCK_UPDATED, source: 'gep', gameTimeSec: 385, payload: { gameTimeSec: 385 } });
  // A manually absent map signal must not be treated as proof that the route is safe.
  const result = pipeline.roleDecision;
  assert.equal(result.action, ROLE_ACTIONS.PREPARE_WISDOM);
  assert.equal(result.dataLimited, true);
  assert.ok(result.missingSignals.includes('laneTargets'));
});

test('confirmed manual lane context unlocks the direct Wisdom move', () => {
  const pipeline = new GameEventPipeline({ initialState: {
    phase: 'playing', hero: 'axe', role: 'offlane', gameTimeSec: 385,
    health: 1000, maxHealth: 1000, mana: 500, maxMana: 500
  }});
  pipeline.dispatch({
    type: GAME_EVENT_TYPES.ROLE_CONTEXT_UPDATED,
    gameTimeSec: 385,
    payload: { wisdomControlRisk: 0.8, wisdomSide: 'top' }
  });
  assert.equal(pipeline.roleDecision.action, ROLE_ACTIONS.MOVE_TO_WISDOM);
  assert.equal(pipeline.roleDecision.target, 'top');
});

test('dynamic role signals become stale when the clock moves without refresh', () => {
  const pipeline = new GameEventPipeline({ initialState: { phase: 'playing', hero: 'queen_of_pain', role: 'mid', gameTimeSec: 300 } });
  pipeline.dispatch({
    type: GAME_EVENT_TYPES.ROLE_CONTEXT_UPDATED,
    gameTimeSec: 300,
    payload: {
      lanePushed: true,
      safeMoveAvailable: true,
      lanes: { bottom: { killPotential: 0.8, danger: 0.1 } }
    }
  });
  pipeline.dispatch({ type: GAME_EVENT_TYPES.CLOCK_UPDATED, source: 'gep', gameTimeSec: 340, payload: { gameTimeSec: 340 } });
  const summary = roleContextSummary(pipeline.state.roleContext);
  assert.ok(summary.staleSignals.includes('laneState'));
  assert.ok(summary.staleSignals.includes('laneTargets'));
});

test('limited context caps confidence and exposes limitations', () => {
  const state = createInitialGameState({
    phase: 'playing', role: 'mid', gameTimeSec: 500,
    health: 900, maxHealth: 1000, mana: 700, maxMana: 800,
    roleContext: { lanePushed: false }
  });
  const result = evaluateRoleDecision(state);
  assert.ok(result.confidence <= 0.74);
  assert.equal(result.dataLimited, true);
});

test('GEP capability limitations survive MATCH_STARTED session reset', () => {
  const session = new GepDiagnosticSession();
  session.ingestEnvelope({
    type: 'status', receivedAt: 1000,
    payload: {
      features: ['clock_time_changed', 'hero_item_changed'],
      supportedFeatures: ['clock_time_changed'],
      missingFeatures: ['hero_item_changed']
    }
  });
  const snapshot = session.ingestEnvelope({
    type: 'game-event', receivedAt: 1100,
    payload: { events: [{ name: 'new_game', data: '{"match_id":"context-reset"}' }] }
  });
  assert.equal(snapshot.pipeline.state.roleContext.meta.signals.ownInventory.status, ROLE_SIGNAL_STATUS.UNAVAILABLE);
  assert.deepEqual(snapshot.pipeline.state.roleContext.meta.missingFeatures, ['hero_item_changed']);
});

test('timer-only mid context converts an unverified shove into PREPARE_POWER_RUNE', () => {
  const pipeline = new GameEventPipeline({ initialState: {
    phase: 'playing', hero: 'queen_of_pain', role: 'mid', gameTimeSec: 345,
    health: 900, maxHealth: 1000, mana: 650, maxMana: 800
  }});
  pipeline.dispatch({
    type: GAME_EVENT_TYPES.ROLE_CONTEXT_CAPABILITIES_UPDATED,
    source: 'gep',
    payload: { supportedFeatures: ['clock_time_changed'], missingFeatures: [] }
  });
  pipeline.dispatch({ type: GAME_EVENT_TYPES.CLOCK_UPDATED, source: 'gep', gameTimeSec: 345, payload: { gameTimeSec: 345 } });
  assert.equal(pipeline.roleDecision.action, ROLE_ACTIONS.PREPARE_POWER_RUNE);
  assert.equal(pipeline.roleDecision.originalAction, ROLE_ACTIONS.SHOVE_LANE);
  assert.ok(pipeline.roleDecision.missingSignals.includes('laneState'));
});


test('explicit false lane state is still trusted as manual context', () => {
  const pipeline = new GameEventPipeline({ initialState: { phase: 'playing', hero: 'queen_of_pain', role: 'mid', gameTimeSec: 300 } });
  pipeline.dispatch({
    type: GAME_EVENT_TYPES.ROLE_CONTEXT_UPDATED,
    gameTimeSec: 300,
    payload: { lanePushed: false }
  });
  assert.equal(pipeline.state.roleContext.meta.signals.laneState.status, ROLE_SIGNAL_STATUS.MANUAL);
  assert.equal(roleSignalAvailable(pipeline.state.roleContext, 'laneState'), true);
});


test('timer-only mid context remains a safe power-rune preparation just after spawn', () => {
  const pipeline = new GameEventPipeline({ initialState: {
    phase: 'playing', hero: 'queen_of_pain', role: 'mid', gameTimeSec: 370,
    health: 900, maxHealth: 1000, mana: 650, maxMana: 800
  }});
  pipeline.dispatch({ type: GAME_EVENT_TYPES.CLOCK_UPDATED, source: 'gep', gameTimeSec: 370, payload: { gameTimeSec: 370 } });
  assert.equal(pipeline.roleDecision.action, ROLE_ACTIONS.PREPARE_POWER_RUNE);
});
