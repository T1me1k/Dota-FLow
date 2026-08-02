import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COACH_TIMER_KINDS,
  GAME_EVENT_TYPES,
  GameEventPipeline,
  OpenDotaScoutingProvider,
  aggregateFlowPerformance,
  buildPregameBriefing,
  createCoachTimer,
  createInitialGameState,
  evaluateCoachTimers,
  evaluateFlowPerformance,
  recommendAdaptiveBuild,
  recommendCounterItems,
  selectVoiceCoachCue,
  steamId64ToAccountId
} from '../src/index.mjs';

test('counter item engine recommends BKB against a control-heavy enemy draft', () => {
  const state = createInitialGameState({
    phase: 'pregame',
    hero: 'phantom_assassin',
    role: 'carry',
    team: 'radiant',
    draft: { radiant: ['phantom_assassin', 'tidehunter'], dire: ['lion', 'axe', 'puck', 'zeus', 'omniknight'] }
  });
  const result = recommendCounterItems(state);
  assert.equal(result.recommendations[0].id, 'item_black_king_bar');
  assert.ok(result.recommendations[0].reasons.some((reason) => reason.includes('контрол')));
});

test('pregame briefing combines draft threats, build plan and counter items', () => {
  const state = createInitialGameState({
    phase: 'pregame', hero: 'anti_mage', role: 'carry', team: 'radiant',
    draft: { radiant: ['anti_mage', 'tidehunter', 'lion'], dire: ['axe', 'puck', 'zeus', 'omniknight', 'drow_ranger'] }
  });
  const briefing = buildPregameBriefing(state);
  assert.equal(briefing.hero, 'anti_mage');
  assert.ok(briefing.threats.length >= 2);
  assert.ok(briefing.buildPlan?.items.length >= 3);
  assert.ok(briefing.counterItems.length >= 1);
});

test('coach timers expose current rune windows and tracked Roshan respawn window', () => {
  const state = createInitialGameState({
    phase: 'playing', gameTimeSec: 6 * 60 + 50,
    coachContext: { timers: [createCoachTimer(COACH_TIMER_KINDS.ROSHAN, { startedAtSec: 0 })] }
  });
  const result = evaluateCoachTimers(state);
  assert.equal(result.periodic.find((timer) => timer.id === 'wisdom-rune').remainingSec, 10);
  const roshan = result.tracked.find((timer) => timer.kind === 'ROSHAN');
  assert.equal(roshan.status, 'RUNNING');
  assert.equal(roshan.remainingSec, 70);
});

test('Roshan timer enters a respawn window after eight minutes', () => {
  const state = createInitialGameState({
    phase: 'playing', gameTimeSec: 8 * 60 + 20,
    coachContext: { timers: [createCoachTimer('ROSHAN', { startedAtSec: 0 })] }
  });
  const roshan = evaluateCoachTimers(state).tracked[0];
  assert.equal(roshan.status, 'WINDOW');
  assert.equal(roshan.windowRemainingSec, 160);
});

test('pipeline stores coach timers and exposes the coach suite in every snapshot', () => {
  const pipeline = new GameEventPipeline({ initialState: { phase: 'playing', gameTimeSec: 600 } });
  const snapshot = pipeline.dispatch({
    type: GAME_EVENT_TYPES.COACH_TIMER_STARTED,
    gameTimeSec: 600,
    payload: { kind: 'AEGIS', startedAtSec: 600, label: 'Our Aegis' }
  });
  assert.equal(snapshot.state.coachContext.timers.length, 1);
  assert.equal(snapshot.coach.timers.tracked[0].label, 'Our Aegis');
  assert.ok(snapshot.coach.pregame);
});

test('Steam64 conversion and OpenDota provider summarize public recent matches', async () => {
  const steamId = '76561198000000000';
  const accountId = steamId64ToAccountId(steamId);
  const responses = new Map([
    [`https://api.test/players/${accountId}`, { profile: { personaname: 'Flow' }, rank_tier: 55 }],
    [`https://api.test/players/${accountId}/recentMatches`, [
      { player_slot: 0, radiant_win: true, kills: 10, deaths: 2, assists: 8, gold_per_min: 600, xp_per_min: 700, item_0: 1 },
      { player_slot: 128, radiant_win: true, kills: 2, deaths: 6, assists: 4, gold_per_min: 350, xp_per_min: 400, item_0: 1, item_1: 2 }
    ]],
    [`https://api.test/players/${accountId}/wl`, { win: 120, lose: 100 }]
  ]);
  const provider = new OpenDotaScoutingProvider({
    baseUrl: 'https://api.test',
    fetchImpl: async (url) => ({ ok: responses.has(url), status: responses.has(url) ? 200 : 404, json: async () => responses.get(url) })
  });
  const player = await provider.getPlayer(steamId);
  assert.equal(player.status, 'PUBLIC');
  assert.equal(player.recent.matches, 2);
  assert.equal(player.recent.wins, 1);
  assert.equal(player.recent.commonItemIds[0].itemId, 1);
});

test('OpenDota provider degrades safely when public data cannot be loaded', async () => {
  const provider = new OpenDotaScoutingProvider({ fetchImpl: async () => ({ ok: false, status: 429 }) });
  const result = await provider.getPlayer('76561198000000000');
  assert.equal(result.status, 'UNAVAILABLE');
  assert.ok(result.limitations[0].includes('429'));
});

test('Flow Performance Index returns dimensions and personalized improvements', () => {
  const report = evaluateFlowPerformance({
    state: createInitialGameState({
      phase: 'ended', hero: 'luna', gameTimeSec: 32 * 60, level: 22, gpm: 610,
      lastHits: 245, kills: 6, deaths: 7, assists: 11,
      damage: { heroTotal: 21000, towerTotal: 3200 }, teamScore: { radiant: 34, dire: 40 }, team: 'radiant'
    }),
    decisionHistory: Array.from({ length: 14 }, (_, index) => ({ action: index % 2 ? 'FARM' : 'FIGHT' })),
    roleDecisionHistory: [{ action: 'FARM_SAFE_AREA' }]
  });
  assert.ok(report.score >= 0 && report.score <= 100);
  assert.ok(report.improvements.length === 3);
  assert.ok(Object.keys(report.dimensions).includes('economy'));
});

test('voice coach prioritizes an urgent RESET above an upcoming timer', () => {
  const cue = selectVoiceCoachCue({
    state: createInitialGameState({ phase: 'playing', gameTimeSec: 415 }),
    decision: { action: 'RESET', confidence: 0.9, reasons: ['Критически мало здоровья'], changed: true, message: 'Отойди' },
    roleDecision: { action: 'MOVE_TO_WISDOM', confidence: 0.9, message: 'Иди на Wisdom' },
    timers: { alerts: [{ id: 'wisdom-rune', label: 'Wisdom Rune', status: 'UPCOMING', remainingSec: 5 }] }
  });
  assert.equal(cue.category, 'MACRO');
  assert.ok(cue.text.includes('Отойди'));
});

test('coach timer defaults to the current game time when startedAtSec is omitted', () => {
  const pipeline = new GameEventPipeline({ initialState: { phase: 'playing', gameTimeSec: 1120 } });
  const snapshot = pipeline.dispatch({
    type: GAME_EVENT_TYPES.COACH_TIMER_STARTED,
    gameTimeSec: 1120,
    payload: { kind: 'ROSHAN', label: 'Roshan respawn' }
  });
  assert.equal(snapshot.state.coachContext.timers[0].startedAtSec, 1120);
  assert.equal(snapshot.coach.timers.tracked[0].remainingSec, 480);
});

test('coach envelopes update the live pipeline without faking a GEP connection', async () => {
  const { LiveGepBridge, createCoachEventEnvelope } = await import('../src/index.mjs');
  const bridge = new LiveGepBridge({ now: () => 50_000 });
  const snapshot = bridge.ingestEnvelope(createCoachEventEnvelope(
    GAME_EVENT_TYPES.COACH_TIMER_STARTED,
    { kind: 'AEGIS', label: 'Aegis expires' },
    { receivedAt: 50_000, gameTimeSec: 900 }
  ));
  assert.equal(snapshot.bridge.state, 'WAITING');
  assert.equal(snapshot.bridge.coachEnvelopeCount, 1);
  assert.equal(snapshot.diagnostics.pipeline.state.coachContext.timers[0].startedAtSec, 900);
  assert.equal(snapshot.diagnostics.pipeline.coach.timers.tracked[0].label, 'Aegis expires');
});

test('adaptive build advisor selects the defensive Anti-Mage plan against control and burst', () => {
  const state = createInitialGameState({
    phase: 'pregame', hero: 'anti_mage', role: 'carry', team: 'radiant',
    draft: { radiant: ['anti_mage'], dire: ['lion', 'puck', 'axe', 'zeus', 'spirit_breaker'] }
  });
  const result = recommendAdaptiveBuild(state);
  assert.equal(result.status, 'READY');
  assert.equal(result.recommendedPlan.id, 'bf_manta_bkb');
  assert.ok(result.recommendedPlan.reasons.some((reason) => reason.includes('Black King Bar')));
});

test('adaptive build advisor serves a bounded scenario plan for newly calibrated supports', () => {
  const result = recommendAdaptiveBuild(createInitialGameState({ hero: 'bane', role: 'hard_support' }));
  assert.equal(result.status, 'READY');
  assert.equal(result.recommendedPlan.id, 'bane_balanced');
  assert.ok(result.confidence <= 0.72);
});

test('Flow progress profile aggregates dimensions and detects an improving trend', () => {
  const reports = [
    { score: 55, dimensions: { economy: 50, survival: 60 } },
    { score: 58, dimensions: { economy: 52, survival: 62 } },
    { score: 62, dimensions: { economy: 57, survival: 65 } },
    { score: 70, dimensions: { economy: 68, survival: 70 } },
    { score: 75, dimensions: { economy: 74, survival: 72 } },
    { score: 80, dimensions: { economy: 81, survival: 75 } }
  ];
  const profile = aggregateFlowPerformance(reports);
  assert.equal(profile.matchCount, 6);
  assert.equal(profile.trend.direction, 'UP');
  assert.ok(profile.recentAverage > profile.averageScore);
  assert.equal(profile.strengths[0].dimension, 'survival');
});
