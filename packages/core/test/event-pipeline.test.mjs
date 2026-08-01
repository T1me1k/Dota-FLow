import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  createInitialGameState,
  applyGameEvent,
  GameEventPipeline,
  GAME_EVENT_TYPES,
  runReplayScenario
} from '../src/index.mjs';

test('canonical ITEM_ADDED advances the active build plan target', () => {
  const state = createInitialGameState({
    phase: 'playing',
    hero: 'luna',
    buildPlanId: 'manta_bkb',
    inventory: [{ id: 'item_mask_of_madness', name: 'Mask of Madness' }],
    targetItem: { id: 'item_manta', name: 'Manta Style', totalCost: 4650, ownedValue: 3000 }
  });
  const next = applyGameEvent(state, {
    type: GAME_EVENT_TYPES.ITEM_ADDED,
    gameTimeSec: 1000,
    payload: { itemId: 'manta', name: 'Manta Style', cost: 4650 }
  });
  assert.equal(next.targetItem.id, 'item_black_king_bar');
  assert.equal(next.progression.itemAcquiredAt.item_manta, 1000);
});

test('normalizer rejects stale time, backward levels and unsafe numeric values', () => {
  const state = createInitialGameState({
    phase: 'playing',
    gameTimeSec: 600,
    hero: 'luna',
    level: 10,
    health: 1200,
    maxHealth: 1500,
    gold: 900,
    inventory: [{ id: 'item_manta', name: 'Manta Style' }]
  });
  const next = applyGameEvent(state, {
    type: GAME_EVENT_TYPES.GAME_SNAPSHOT,
    gameTimeSec: 500,
    payload: {
      gameTimeSec: 500,
      hero: 'totally_unknown_hero',
      level: 8,
      health: -50,
      maxHealth: 0,
      gold: -100,
      inventory: [
        { id: 'item_manta', name: 'Manta Style' },
        { id: 'item_manta', name: 'Duplicate Manta' },
        { id: 'item_future_patch', name: 'Future Patch Item' }
      ]
    }
  });

  assert.equal(next.gameTimeSec, 600);
  assert.equal(next.level, 10);
  assert.equal(next.hero, 'luna');
  assert.equal(next.health, 0);
  assert.equal(next.maxHealth, 1);
  assert.equal(next.gold, 0);
  assert.deepEqual(next.inventory.map((item) => item.id), ['item_manta', 'item_future_patch']);
  assert.ok(next.diagnostics.warnings.some((warning) => warning.includes('Out-of-order')));
  assert.ok(next.diagnostics.warnings.some((warning) => warning.includes('Backward level')));
  assert.ok(next.diagnostics.warnings.some((warning) => warning.includes('Unknown hero')));
  assert.ok(next.diagnostics.warnings.some((warning) => warning.includes('Unknown item')));
});

test('partial snapshots preserve temporarily missing GEP fields', () => {
  const state = createInitialGameState({
    phase: 'playing',
    gameTimeSec: 700,
    level: 11,
    gold: 1450,
    health: 1300,
    maxHealth: 1600,
    mana: 600,
    maxMana: 800,
    gpm: 520
  });
  const next = applyGameEvent(state, {
    type: GAME_EVENT_TYPES.GAME_SNAPSHOT,
    payload: { gold: 1500 }
  });
  assert.equal(next.gold, 1500);
  assert.equal(next.level, 11);
  assert.equal(next.health, 1300);
  assert.equal(next.maxMana, 800);
  assert.equal(next.gpm, 520);
});

test('pipeline recalculates decisions and records macro action changes', () => {
  const pipeline = new GameEventPipeline({
    coordinatorOptions: { minimumHoldSec: 0, switchMargin: 0 }
  });
  pipeline.dispatch({
    type: GAME_EVENT_TYPES.MATCH_STARTED,
    gameTimeSec: 0,
    payload: { hero: 'luna', buildPlanId: 'manta_bkb' }
  });
  pipeline.dispatch({
    type: GAME_EVENT_TYPES.GAME_SNAPSHOT,
    gameTimeSec: 900,
    payload: {
      level: 12,
      gpm: 570,
      gold: 100,
      unreliableGold: 0,
      health: 1500,
      maxHealth: 1600,
      mana: 700,
      maxMana: 800,
      ultimateReady: true
    }
  });
  pipeline.dispatch({
    type: GAME_EVENT_TYPES.GAME_SNAPSHOT,
    gameTimeSec: 920,
    payload: {
      health: 100,
      mana: 40,
      gold: 2500,
      unreliableGold: 2000,
      context: { safeRouteAvailable: false }
    }
  });

  assert.equal(pipeline.decision.action, 'RESET');
  const resetEntry = pipeline.decisionHistory.find((entry) => entry.action === 'RESET');
  assert.ok(resetEntry);
  assert.equal(resetEntry.gameTimeSec, 920);
  assert.equal(resetEntry.triggerEventType, GAME_EVENT_TYPES.GAME_SNAPSHOT);
  assert.ok(resetEntry.reasons.length > 0);
});

test('malformed events are ignored without breaking current state', () => {
  const state = createInitialGameState({ phase: 'playing', gameTimeSec: 300, gold: 1000 });
  const next = applyGameEvent(state, { type: 'NOT_A_REAL_EVENT', payload: { gold: 99999 } });
  assert.equal(next.gold, 1000);
  assert.equal(next.gameTimeSec, 300);
  assert.equal(next.diagnostics.ignoredEventCount, 1);
});

test('JSON replay scenario produces a deterministic timeline and decision history', async () => {
  const scenario = JSON.parse(await readFile(new URL('../../../fixtures/replays/luna-standard-game.json', import.meta.url), 'utf8'));
  const result = runReplayScenario(scenario, {
    coordinatorOptions: { minimumHoldSec: 0, switchMargin: 0 }
  });
  assert.equal(result.eventCount, scenario.events.length);
  assert.equal(result.finalState.phase, 'ended');
  assert.equal(result.timeline.length, scenario.events.length);
  assert.ok(result.finalState.inventory.some((item) => item.id === 'item_manta'));
  assert.equal(result.finalState.targetItem.id, 'item_black_king_bar');
  assert.ok(result.decisionHistory.some((entry) => entry.action === 'RESET'));
});


test('late item events keep monotonic acquisition timestamps', () => {
  const state = createInitialGameState({
    phase: 'playing',
    gameTimeSec: 900,
    hero: 'luna',
    buildPlanId: 'manta_bkb',
    targetItem: { id: 'item_mask_of_madness', name: 'Mask of Madness', totalCost: 1900, ownedValue: 0 }
  });
  const next = applyGameEvent(state, {
    type: GAME_EVENT_TYPES.ITEM_ADDED,
    gameTimeSec: 840,
    payload: { itemId: 'item_mask_of_madness', name: 'Mask of Madness', cost: 1900 }
  });

  assert.equal(next.gameTimeSec, 900);
  assert.equal(next.progression.itemAcquiredAt.item_mask_of_madness, 900);
  assert.ok(next.diagnostics.warnings.some((warning) => warning.includes('Out-of-order event time clamped')));
});

test('starting a new match resets per-match decision history and event count', () => {
  const pipeline = new GameEventPipeline({ coordinatorOptions: { minimumHoldSec: 0, switchMargin: 0 } });
  pipeline.dispatch({
    type: GAME_EVENT_TYPES.MATCH_STARTED,
    gameTimeSec: 0,
    payload: { hero: 'luna', buildPlanId: 'manta_bkb' }
  });
  pipeline.dispatch({
    type: GAME_EVENT_TYPES.GAME_SNAPSHOT,
    gameTimeSec: 600,
    payload: { health: 50, maxHealth: 1000, mana: 20, maxMana: 500, gold: 2200, unreliableGold: 1800 }
  });
  assert.equal(pipeline.eventCount, 2);
  assert.ok(pipeline.decisionHistory.length >= 2);

  pipeline.dispatch({
    type: GAME_EVENT_TYPES.MATCH_STARTED,
    gameTimeSec: 0,
    payload: { hero: 'phantom_assassin', buildPlanId: 'bf_desolator_bkb' }
  });

  assert.equal(pipeline.eventCount, 1);
  assert.equal(pipeline.decisionHistory.length, 1);
  assert.equal(pipeline.decisionHistory[0].previousAction, null);
  assert.equal(pipeline.decisionHistory[0].triggerEventType, GAME_EVENT_TYPES.MATCH_STARTED);
});
