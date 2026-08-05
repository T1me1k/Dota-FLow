import test from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { buildFarmCapability, FARM_ROUTE_LIMITS, planFarmRoute } from '../src/farm-route-engine.mjs';
import { createGameEventPipeline } from '../src/live-pipeline.mjs';
import { GAME_EVENT_TYPES } from '../src/game-events.mjs';

function node(id, type, x, y, overrides = {}) {
  return {
    id,
    label: id.replaceAll('_', ' '),
    type,
    position: { x, y },
    available: true,
    availabilityQuality: 'LIVE',
    safety: 'SAFE',
    safetyQuality: 'LIVE',
    ...overrides
  };
}

function state(overrides = {}) {
  return {
    source: 'gsi',
    phase: 'playing',
    matchId: 'farm-route-live',
    gameTimeSec: 900,
    hero: 'morphling',
    role: 'carry',
    team: 'radiant',
    level: 12,
    health: 1600,
    maxHealth: 1800,
    mana: 820,
    maxMana: 1000,
    netWorth: 8600,
    moveSpeed: 320,
    position: { x: 0, y: 0 },
    inventory: [{ id: 'item_morbid_mask' }, { id: 'item_maelstrom' }],
    roleContext: { playerNetWorth: 8600, meta: { quality: 'LIVE', signals: {} } },
    farmNodes: [
      node('safe_lane_wave', 'LANE', 90, 0, { expectedGold: 260, clearTimeSec: 16 }),
      node('large_jungle', 'LARGE', 190, 20, { expectedGold: 225, clearTimeSec: 20 }),
      node('ancient_triangle', 'ANCIENT', 290, 35, { expectedGold: 330, clearTimeSec: 28 })
    ],
    ...overrides
  };
}

test('route fails closed when local position is unavailable', () => {
  const result = planFarmRoute(state({ position: null }));
  assert.equal(result.status, 'UNAVAILABLE');
  assert.deepEqual(result.route, []);
  assert.ok(result.missingSignals.includes('LOCAL_POSITION'));
  assert.equal(result.confidence, 0);
});

test('route fails closed when no observed lane or camp nodes exist', () => {
  const result = planFarmRoute(state({ farmNodes: [] }));
  assert.equal(result.status, 'UNAVAILABLE');
  assert.ok(result.missingSignals.includes('FARM_ROUTE_NODES'));
  assert.equal(result.nextNode, null);
});

test('unknown safety and stale availability never produce a concrete route', () => {
  const result = planFarmRoute(state({
    farmNodes: [
      node('unknown_camp', 'LARGE', 100, 0, { safety: 'UNKNOWN' }),
      node('stale_wave', 'LANE', 120, 0, { availabilityQuality: 'STALE' })
    ]
  }));
  assert.equal(result.status, 'UNAVAILABLE');
  assert.deepEqual(result.route, []);
  assert.ok(result.missingSignals.some((signal) => signal === 'SAFETY:unknown_camp'));
  assert.ok(result.missingSignals.some((signal) => signal === 'AVAILABILITY:stale_wave'));
});

test('confirmed dangerous nodes are excluded even when their value is highest', () => {
  const result = planFarmRoute(state({
    farmNodes: [
      node('safe_wave', 'LANE', 90, 0, { expectedGold: 190 }),
      node('danger_ancients', 'ANCIENT', 40, 0, { expectedGold: 999, safety: 'DANGEROUS' })
    ]
  }));
  assert.equal(result.status, 'READY');
  assert.deepEqual(result.route.map((entry) => entry.id), ['safe_wave']);
  assert.ok(result.route.every((entry) => entry.safety !== 'DANGEROUS'));
});

test('strong Morphling with sustain can include confirmed safe ancients', () => {
  const capability = buildFarmCapability(state());
  const result = planFarmRoute(state());
  assert.equal(capability.ancientEligible, true);
  assert.equal(result.status, 'READY');
  assert.ok(result.route.some((entry) => entry.type === 'ANCIENT'));
  assert.ok(result.reasons.includes('ANCIENTS_CONFIRMED_ELIGIBLE'));
  assert.equal(result.dataQuality, 'LIVE');
});

test('underfarmed Monkey King is never sent to ancients', () => {
  const monkey = state({
    hero: 'monkey_king',
    level: 8,
    netWorth: 4200,
    health: 900,
    maxHealth: 1400,
    inventory: [{ id: 'item_power_treads' }],
    roleContext: { playerNetWorth: 4200, meta: { quality: 'LIVE', signals: {} } },
    farmNodes: [
      node('safe_lane', 'LANE', 80, 0, { expectedGold: 220 }),
      node('ancient_stack', 'ANCIENT', 50, 0, { expectedGold: 700 })
    ]
  });
  const capability = buildFarmCapability(monkey);
  const result = planFarmRoute(monkey);
  assert.equal(capability.ancientEligible, false);
  assert.equal(result.status, 'READY');
  assert.ok(result.route.length > 0);
  assert.ok(result.route.every((entry) => entry.type !== 'ANCIENT'));

  const ancientOnly = planFarmRoute({ ...monkey, farmNodes: [monkey.farmNodes[1]] });
  assert.equal(ancientOnly.status, 'BLOCKED');
  assert.ok(ancientOnly.blockers.includes('HERO_NOT_READY_FOR_ANCIENTS:ancient_stack'));
});

test('planner supports a deterministic lane to camp to camp chain', () => {
  const result = planFarmRoute(state({
    farmNodes: [
      node('lane_wave', 'LANE', 70, 0, { expectedGold: 280, clearTimeSec: 14 }),
      node('large_camp', 'LARGE', 150, 0, { expectedGold: 240, clearTimeSec: 18 }),
      node('medium_camp', 'MEDIUM', 225, 0, { expectedGold: 190, clearTimeSec: 14 })
    ]
  }));
  assert.equal(result.status, 'READY');
  assert.equal(result.route.length, 3);
  assert.deepEqual(result.route.map((entry) => entry.id), ['lane_wave', 'large_camp', 'medium_camp']);
  assert.equal(result.nextNode.id, 'lane_wave');
  assert.match(result.instructionRu, /Следующий фарм/);
  assert.match(result.instructionEn, /Next farm/);
});

test('live pipeline recalculates and removes a route after confirmed critical health', () => {
  const pipeline = createGameEventPipeline({ initialState: state() });
  const initial = pipeline.snapshot();
  assert.equal(initial.farmRoute.status, 'READY');
  assert.equal(initial.dataQuality.farmRoute, 'LIVE');

  const changed = pipeline.dispatch({
    type: GAME_EVENT_TYPES.HERO_VITALS_CHANGED,
    source: 'gsi',
    gameTimeSec: 901,
    payload: { health: 300, maxHealth: 1800, mana: 700, maxMana: 1000 }
  });
  assert.equal(changed.farmRoute.status, 'BLOCKED');
  assert.deepEqual(changed.farmRoute.route, []);
  assert.ok(changed.farmRoute.blockers.some((blocker) => blocker.startsWith('LOCAL_HEALTH_TOO_LOW:')));
});

test('planner enforces deterministic live CPU and graph bounds', () => {
  const nodes = Array.from({ length: 100 }, (_, index) => node(
    `node_${index}`,
    index % 5 === 0 ? 'LANE' : index % 4 === 0 ? 'ANCIENT' : 'LARGE',
    25 + index * 12,
    index % 7,
    { expectedGold: 120 + index }
  ));
  const startedAt = performance.now();
  const result = planFarmRoute(state({ farmNodes: nodes }));
  const elapsedMs = performance.now() - startedAt;
  assert.ok(result.route.length <= FARM_ROUTE_LIMITS.maxRouteNodes);
  assert.equal(result.diagnostics.evaluatedNodeCount, FARM_ROUTE_LIMITS.maxInputNodes);
  assert.ok(result.diagnostics.expansions <= FARM_ROUTE_LIMITS.maxExpansions);
  assert.ok(elapsedMs < 100, `planner took ${elapsedMs.toFixed(2)} ms`);
});
