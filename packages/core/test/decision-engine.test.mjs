import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialGameState,
  evaluateMacroDecision,
  StableDecisionCoordinator,
  reduceGameEvent,
  reduceInfoUpdate
} from '../src/index.mjs';

test('recommends FARM when close to key item and below GPM benchmark', () => {
  const state = createInitialGameState({
    phase: 'playing',
    gameTimeSec: 14 * 60,
    level: 10,
    gold: 900,
    gpm: 430,
    ultimateReady: false,
    targetItem: {
      id: 'item_manta',
      name: 'Manta Style',
      totalCost: 4600,
      ownedValue: 2800
    }
  });
  const result = evaluateMacroDecision(state);
  assert.equal(result.action, 'FARM');
  assert.ok(result.reasons.some((reason) => reason.includes('Manta')));
});

test('recommends RESET at critically low health', () => {
  const state = createInitialGameState({
    phase: 'playing',
    gameTimeSec: 18 * 60,
    health: 200,
    maxHealth: 1600,
    mana: 100,
    maxMana: 900,
    gold: 2400,
    unreliableGold: 2100,
    ultimateReady: false
  });
  const result = evaluateMacroDecision(state);
  assert.equal(result.action, 'RESET');
});

test('recommends PRESSURE when ahead and enemy core is dead', () => {
  const state = createInitialGameState({
    phase: 'playing',
    gameTimeSec: 22 * 60,
    level: 18,
    gpm: 780,
    gold: 300,
    health: 1800,
    maxHealth: 1900,
    mana: 900,
    maxMana: 1000,
    ultimateReady: true,
    inventory: [{ id: 'item_manta', name: 'Manta Style' }],
    targetItem: {
      id: 'item_manta',
      name: 'Manta Style',
      totalCost: 4600,
      ownedValue: 4600
    },
    context: {
      enemyCoreDead: true,
      alliesReady: 4,
      safeRouteAvailable: true
    }
  });
  const result = evaluateMacroDecision(state);
  assert.equal(result.action, 'PRESSURE');
});

test('GEP event reducer parses string payloads', () => {
  const state = createInitialGameState({ phase: 'playing' });
  const next = reduceGameEvent(state, {
    name: 'gold',
    data: JSON.stringify({ gold: 1200, gold_reliable: 200, gold_unreliable: 1000 })
  });
  assert.equal(next.gold, 1200);
  assert.equal(next.reliableGold, 200);
  assert.equal(next.unreliableGold, 1000);
});

test('buying the current target selects the next unowned item in the active build plan', () => {
  const state = createInitialGameState({
    phase: 'playing',
    hero: 'luna',
    buildPlanId: 'manta_bkb',
    inventory: [
      { id: 'item_mask_of_madness', name: 'Mask of Madness' },
      { id: 'item_black_king_bar', name: 'Black King Bar' }
    ],
    targetItem: { id: 'item_manta', name: 'Manta Style', totalCost: 4650, ownedValue: 3200 }
  });
  const next = reduceGameEvent(state, {
    name: 'hero_item_changed',
    data: { item_id: 'item_manta', display_name: 'Manta Style' }
  });
  assert.equal(next.targetItem.id, 'item_satanic');
  assert.equal(next.targetItem.name, 'Satanic');
  assert.equal(next.targetItem.ownedValue, 0);
});

test('roster info update builds both drafts', () => {
  const state = createInitialGameState();
  const next = reduceInfoUpdate(state, {
    feature: 'roster',
    info: {
      roster: {
        players: JSON.stringify([
          { team: 2, hero: 'luna' },
          { team: 2, hero: 'axe' },
          { team: 3, hero: 'slark' }
        ])
      }
    }
  });
  assert.deepEqual(next.draft.radiant, ['luna', 'axe']);
  assert.deepEqual(next.draft.dire, ['slark']);
});

test('stable coordinator prevents rapid non-urgent switches', () => {
  const coordinator = new StableDecisionCoordinator({ minimumHoldSec: 30, switchMargin: 12 });
  const first = coordinator.update(createInitialGameState({
    phase: 'playing',
    gameTimeSec: 600,
    gpm: 350,
    gold: 500,
    targetItem: { id: 'item_manta', name: 'Manta Style', totalCost: 4600, ownedValue: 3200 }
  }));
  const second = coordinator.update(createInitialGameState({
    phase: 'playing',
    gameTimeSec: 605,
    gpm: 750,
    gold: 300,
    ultimateReady: true,
    inventory: [{ id: 'item_manta', name: 'Manta Style' }],
    targetItem: { id: 'item_manta', name: 'Manta Style', totalCost: 4600, ownedValue: 4600 }
  }));
  assert.equal(first.action, 'FARM');
  assert.equal(second.action, 'FARM');
  assert.ok(second.pendingAction);
});
