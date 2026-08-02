import test from 'node:test';
import assert from 'node:assert/strict';

import { createInitialGameState } from '../src/game-state.mjs';
import { StableDecisionCoordinator } from '../src/decision-engine.mjs';
import { getHeroProfile, listHeroProfiles } from '../src/hero-profiles.mjs';
import { evaluatePowerState } from '../src/power-spike-engine.mjs';

const MID_PROFILE_IDS = Object.freeze([
  'ember_spirit',
  'invoker',
  'lina',
  'puck',
  'queen_of_pain',
  'storm_spirit',
  'void_spirit',
  'zeus'
]);

const SIGNATURE_ITEMS = Object.freeze({
  ember_spirit: 'item_maelstrom',
  invoker: 'item_hand_of_midas',
  lina: 'item_maelstrom',
  puck: 'item_blink',
  queen_of_pain: 'item_orchid',
  storm_spirit: 'item_orchid',
  void_spirit: 'item_orchid',
  zeus: 'item_ultimate_scepter'
});

test('first mid intelligence pack raises detailed coverage from 32 to 40 heroes', () => {
  const detailed = listHeroProfiles().filter((profile) => profile.calibrationTier === 'DETAILED');
  assert.equal(detailed.length, 40);

  for (const heroId of MID_PROFILE_IDS) {
    assert.ok(detailed.some((profile) => profile.id === heroId), `${heroId} must be detailed`);
  }
});

test('every mid pack hero has concrete builds and named non-generic spikes', () => {
  for (const heroId of MID_PROFILE_IDS) {
    const profile = getHeroProfile(heroId);
    assert.equal(profile.role, 'mid');
    assert.equal(profile.calibrationTier, 'DETAILED');
    assert.ok(profile.buildPlans.length >= 2, `${heroId} needs at least two build plans`);
    assert.ok(profile.buildPlans.every((plan) => !plan.generic && plan.items.length >= 4));
    assert.ok(profile.spikes.length >= 3, `${heroId} needs at least three power spikes`);
    assert.ok(profile.spikes.every((spike) => !spike.generic && spike.recommendation));
  }
});

test('signature items activate hero-specific mid power spikes', () => {
  for (const heroId of MID_PROFILE_IDS) {
    const itemId = SIGNATURE_ITEMS[heroId];
    const acquiredAtSec = 15 * 60;
    const state = createInitialGameState({
      phase: 'playing',
      hero: heroId,
      role: 'mid',
      gameTimeSec: acquiredAtSec + 30,
      level: 12,
      ultimateReady: true,
      health: 1000,
      maxHealth: 1000,
      mana: 1000,
      maxMana: 1000,
      inventory: [{ id: itemId, name: itemId }],
      progression: {
        itemAcquiredAt: { [itemId]: acquiredAtSec },
        levelReachedAt: { 6: 6 * 60, 9: 9 * 60, 12: 15 * 60 }
      }
    });

    const power = evaluatePowerState(state);
    assert.equal(power.hero, heroId);
    assert.ok(
      power.permanentSpikes.some((spike) => spike.id.startsWith(`${heroId}_`)),
      `${heroId} should activate a hero-specific spike from ${itemId}`
    );
  }
});

test('emergency RESET is released after respawn and resource recovery', () => {
  const coordinator = new StableDecisionCoordinator({ minimumHoldSec: 300, switchMargin: 100 });
  const dead = createInitialGameState({
    phase: 'playing',
    hero: 'puck',
    role: 'mid',
    gameTimeSec: 10 * 60,
    alive: false,
    health: 0,
    maxHealth: 1200,
    mana: 0,
    maxMana: 800,
    gold: 500,
    unreliableGold: 0
  });
  assert.equal(coordinator.update(dead).action, 'RESET');

  const recovered = createInitialGameState({
    phase: 'playing',
    hero: 'puck',
    role: 'mid',
    gameTimeSec: 10 * 60 + 5,
    alive: true,
    health: 1000,
    maxHealth: 1200,
    mana: 600,
    maxMana: 800,
    gold: 500,
    unreliableGold: 0,
    level: 11,
    ultimateReady: true
  });
  assert.notEqual(coordinator.update(recovered).action, 'RESET');
});
