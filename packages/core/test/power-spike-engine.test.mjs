import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialGameState,
  evaluatePowerState,
  evaluateMacroDecision,
  SPIKE_STATUS
} from '../src/index.mjs';

function item(id, name = id) {
  return { id, name };
}

test('Luna Manta spike favors farm and pressure over a pure fight spike', () => {
  const state = createInitialGameState({
    phase: 'playing', hero: 'luna', gameTimeSec: 18 * 60, level: 13,
    health: 1500, maxHealth: 1600, mana: 700, maxMana: 800,
    ultimateReady: true,
    inventory: [item('item_manta', 'Manta Style')],
    progression: { itemAcquiredAt: { item_manta: 17 * 60 }, levelReachedAt: { 6: 7 * 60 } },
    targetItem: { id: 'item_black_king_bar', name: 'Black King Bar', totalCost: 4050, ownedValue: 800 }
  });
  const power = evaluatePowerState(state);
  assert.equal(power.status, SPIKE_STATUS.ACTIVE);
  assert.equal(power.primarySpike.id, 'luna_manta');
  assert.ok(power.dimensions.farm > power.dimensions.fight);
  assert.ok(power.actionBias.PRESSURE > power.actionBias.FIGHT);
});

test('Ursa Blink creates a fight and objective window', () => {
  const state = createInitialGameState({
    phase: 'playing', hero: 'ursa', gameTimeSec: 14 * 60 + 30, level: 11,
    health: 1450, maxHealth: 1550, mana: 520, maxMana: 620, ultimateReady: true,
    inventory: [item('item_blink', 'Blink Dagger')],
    progression: { itemAcquiredAt: { item_blink: 14 * 60 }, levelReachedAt: { 6: 7 * 60 } },
    context: { roshanAvailable: true, alliesReady: 3 }
  });
  const power = evaluatePowerState(state);
  assert.equal(power.primarySpike.id, 'ursa_blink');
  assert.ok(power.actionBias.FIGHT >= 20);
  assert.ok(power.actionBias.OBJECTIVE >= 18);
  assert.ok(power.dimensions.objective >= 90);
});

test('Phantom Assassin without BKB is blocked by control-heavy enemy draft', () => {
  const state = createInitialGameState({
    phase: 'playing', hero: 'phantom_assassin', team: 'radiant', gameTimeSec: 22 * 60, level: 16,
    health: 1500, maxHealth: 1600, mana: 600, maxMana: 700, ultimateReady: true,
    inventory: [item('item_bfury'), item('item_desolator')],
    progression: { itemAcquiredAt: { item_bfury: 15 * 60, item_desolator: 21 * 60 } },
    draft: {
      radiant: ['phantom_assassin', 'puck', 'tusk', 'treant', 'beastmaster'],
      dire: ['axe', 'lion', 'shadow_shaman', 'necrophos', 'omniknight']
    }
  });
  const power = evaluatePowerState(state);
  assert.ok(power.blockers.some((text) => text.includes('BKB')));
  assert.ok(power.actionBias.FIGHT < 15);
});

test('same item spike is stronger when acquired early than very late', () => {
  const early = evaluatePowerState(createInitialGameState({
    phase: 'playing', hero: 'ursa', gameTimeSec: 14 * 60, level: 11, ultimateReady: true,
    inventory: [item('item_blink')], progression: { itemAcquiredAt: { item_blink: 11 * 60 } }
  }));
  const late = evaluatePowerState(createInitialGameState({
    phase: 'playing', hero: 'ursa', gameTimeSec: 23 * 60, level: 16, ultimateReady: true,
    inventory: [item('item_blink')], progression: { itemAcquiredAt: { item_blink: 22 * 60 } }
  }));
  const earlySpike = early.activeSpikes.find((spike) => spike.id === 'ursa_blink');
  const lateSpike = late.activeSpikes.find((spike) => spike.id === 'ursa_blink') ?? late.missedSpikes.find((spike) => spike.id === 'ursa_blink');
  assert.equal(earlySpike.timing.key, 'EARLY');
  assert.equal(lateSpike.timing.key, 'VERY_LATE');
  assert.ok(earlySpike.effectiveMultiplier > lateSpike.effectiveMultiplier);
});

test('approaching target item exposes the next named spike', () => {
  const state = createInitialGameState({
    phase: 'playing', hero: 'luna', gameTimeSec: 16 * 60, level: 12, gold: 500,
    targetItem: { id: 'item_manta', name: 'Manta Style', totalCost: 4650, ownedValue: 3700 }
  });
  const power = evaluatePowerState(state);
  assert.equal(power.status, SPIKE_STATUS.APPROACHING);
  assert.equal(power.nextSpike.id, 'luna_manta');
  assert.ok(power.nextSpike.proximity.missing.some((text) => text.includes('450')));
});

test('old missed spikes stay in history without keeping the global status MISSED', () => {
  const recent = evaluatePowerState(createInitialGameState({
    phase: 'playing', hero: 'luna', gameTimeSec: 12 * 60, level: 10,
    progression: { levelReachedAt: { 6: 7 * 60 } },
    targetItem: { id: 'item_manta', name: 'Manta Style', totalCost: 4650, ownedValue: 0 }
  }));
  const old = evaluatePowerState(createInitialGameState({
    phase: 'playing', hero: 'luna', gameTimeSec: 25 * 60, level: 10,
    progression: { levelReachedAt: { 6: 7 * 60 } },
    targetItem: { id: 'item_manta', name: 'Manta Style', totalCost: 4650, ownedValue: 0 }
  }));
  assert.equal(recent.status, SPIKE_STATUS.MISSED);
  assert.equal(old.status, SPIKE_STATUS.NONE);
  assert.ok(old.missedSpikes.some((spike) => spike.id === 'luna_level_6'));
});

test('macro engine consumes hero-specific power bias', () => {
  const state = createInitialGameState({
    phase: 'playing', hero: 'ursa', gameTimeSec: 15 * 60, level: 12, gpm: 520,
    health: 1500, maxHealth: 1600, mana: 600, maxMana: 700, ultimateReady: true,
    gold: 100, unreliableGold: 50,
    inventory: [item('item_blink')], progression: { itemAcquiredAt: { item_blink: 14 * 60 } },
    targetItem: { id: 'item_black_king_bar', name: 'Black King Bar', totalCost: 4050, ownedValue: 1000 },
    context: { roshanAvailable: true, alliesReady: 4, safeRouteAvailable: true }
  });
  const decision = evaluateMacroDecision(state);
  assert.ok(['FIGHT', 'OBJECTIVE', 'CONNECT'].includes(decision.action));
  assert.equal(decision.powerState.primarySpike.id, 'ursa_blink');
});
