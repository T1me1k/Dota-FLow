import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createGameEventPipeline } from '../src/live-pipeline.mjs';
import { GAME_EVENT_TYPES } from '../src/game-events.mjs';
import { LIVE_CARD_LOCALIZED_HERO_IDS } from '../src/live-card-copy.mjs';

const root = resolve(import.meta.dirname, '../../..');

function liveState(hero, overrides = {}) {
  return {
    source: 'gsi',
    phase: 'playing',
    matchId: `live-${hero}`,
    gameTimeSec: 8 * 60,
    hero,
    role: hero === 'sniper' ? 'mid' : 'carry',
    team: 'radiant',
    level: 7,
    gold: 900,
    gpm: 455,
    xpm: 500,
    health: 1100,
    maxHealth: 1400,
    mana: 600,
    maxMana: 750,
    alive: true,
    ultimateReady: true,
    inventory: [{ id: 'item_power_treads', name: 'Power Treads' }],
    abilities: {},
    progression: { levelReachedAt: { 6: 450 }, itemAcquiredAt: {} },
    roleContext: {
      playerNetWorth: 4300,
      dangerLevel: 0.2,
      alliesNearby: 1,
      enemiesNearby: 1,
      meta: { quality: 'LIVE', signals: { playerNetWorth: { quality: 'LIVE', value: 4300 } } }
    },
    context: { safeRouteAvailable: false, roshanAvailable: false, alliesReady: 0, enemiesVisible: 0 },
    draft: { radiant: [hero], dire: [] },
    ...overrides
  };
}

const HERO_CASES = [
  { hero: 'morphling', spikeId: 'morphling_level_6', planId: 'morphling_balanced', nextItemId: 'item_manta', nextAfterId: 'item_sphere', firstItem: { id: 'item_manta', name: 'Manta Style' } },
  { hero: 'sniper', spikeId: 'sniper_level_6', planId: 'sniper_balanced', nextItemId: 'item_dragon_lance', nextAfterId: 'item_maelstrom', firstItem: { id: 'item_dragon_lance', name: 'Dragon Lance' } },
  { hero: 'monkey_king', spikeId: 'monkey_king_level_6', planId: 'monkey_king_balanced', nextItemId: 'item_echo_sabre', nextAfterId: 'item_desolator', firstItem: { id: 'item_echo_sabre', name: 'Echo Sabre' } }
];

for (const heroCase of HERO_CASES) {
  test(`${heroCase.hero} live GSI card has deterministic Russian and English copy`, () => {
    const snapshot = createGameEventPipeline({ initialState: liveState(heroCase.hero) }).snapshot();
    assert.equal(snapshot.powerSpike.status, 'ACTIVE');
    assert.equal(snapshot.powerSpike.primarySpike.id, heroCase.spikeId);
    assert.ok(snapshot.powerSpike.nameRu.length > 8);
    assert.ok(snapshot.powerSpike.nameEn.length > 8);
    assert.notEqual(snapshot.powerSpike.nameRu, snapshot.powerSpike.nameEn);
    assert.ok(snapshot.powerSpike.recommendationRu.length > 20);
    assert.ok(snapshot.powerSpike.recommendationEn.length > 20);
    assert.match(snapshot.powerSpike.statusDetailRu, /подтверждён/i);
    assert.match(snapshot.powerSpike.statusDetailEn, /confirmed/i);
    assert.equal(snapshot.adaptiveBuild.activePlanId, heroCase.planId);
    assert.ok(snapshot.adaptiveBuild.activePlanRu.length > 8);
    assert.ok(snapshot.adaptiveBuild.activePlanEn.length > 8);
    assert.notEqual(snapshot.adaptiveBuild.activePlanRu, snapshot.adaptiveBuild.activePlanEn);
    assert.equal(snapshot.adaptiveBuild.nextItemId, heroCase.nextItemId);
    assert.match(snapshot.adaptiveBuild.nextItemReasonRu, /драфт/i);
    assert.match(snapshot.adaptiveBuild.nextItemReasonEn, /draft/i);
  });

  test(`${heroCase.hero} adaptive build advances only after a confirmed inventory item`, () => {
    const pipeline = createGameEventPipeline({ initialState: liveState(heroCase.hero) });
    const snapshot = pipeline.dispatch({
      type: GAME_EVENT_TYPES.GAME_SNAPSHOT,
      source: 'gsi',
      gameTimeSec: 540,
      payload: { inventory: [{ id: 'item_power_treads', name: 'Power Treads' }, heroCase.firstItem] }
    });
    assert.equal(snapshot.adaptiveBuild.nextItemId, heroCase.nextAfterId);
    assert.notEqual(snapshot.adaptiveBuild.nextItemId, heroCase.nextItemId);
  });
}

test('missing enemy draft remains explicit and cannot select an anti-control plan', () => {
  const snapshot = createGameEventPipeline({ initialState: liveState('sniper') }).snapshot();
  assert.equal(snapshot.adaptiveBuild.activePlanId, 'sniper_balanced');
  assert.ok(snapshot.adaptiveBuild.limitations.includes('missing_signal:complete_enemy_draft'));
  assert.doesNotMatch(JSON.stringify(snapshot), /enemyNetWorth|enemy_net_worth/);
});

test('confirmed but blocked spike exposes bilingual blockers without hiding the trigger', () => {
  const snapshot = createGameEventPipeline({ initialState: liveState('monkey_king', { ultimateReady: false }) }).snapshot();
  assert.equal(snapshot.powerSpike.status, 'ACTIVE');
  assert.equal(snapshot.powerSpike.blocked, true);
  assert.equal(snapshot.powerSpike.spikeBlockersRu.length, 1);
  assert.equal(snapshot.powerSpike.spikeBlockersEn.length, 1);
  assert.match(snapshot.powerSpike.spikeBlockersRu[0], /Wukong/);
  assert.match(snapshot.powerSpike.statusDetailEn, /not met/i);
});

test('desktop live-card enhancer consumes the one normalized snapshot stream', async () => {
  const [index, store, enhancer, copy] = await Promise.all([
    readFile(resolve(root, 'apps/desktop/index.html'), 'utf8'),
    readFile(resolve(root, 'apps/desktop/src/runtime/store.tsx'), 'utf8'),
    readFile(resolve(root, 'apps/desktop/src/live-card-enhancer.ts'), 'utf8'),
    readFile(resolve(root, 'packages/core/src/live-card-copy.mjs'), 'utf8')
  ]);
  assert.deepEqual(LIVE_CARD_LOCALIZED_HERO_IDS, ['morphling', 'sniper', 'monkey_king']);
  assert.match(index, /live-card-enhancer\.ts/);
  assert.ok(index.indexOf('live-card-enhancer.ts') < index.indexOf('main.tsx'));
  assert.match(store, /dota-flow:runtime-snapshot/);
  assert.match(store, /publishSnapshot\(normalized\)/);
  for (const token of ['statusDetail','spikeBlockers','activePlan','nextItemReason']) assert.match(enhancer, new RegExp(token));
  for (const token of ['nameRu','nameEn','recommendationRu','recommendationEn','activePlanRu','activePlanEn']) assert.match(copy, new RegExp(token));
  assert.doesNotMatch(enhancer, /\.subscribe\(|dotaFlowRuntime/);
});
