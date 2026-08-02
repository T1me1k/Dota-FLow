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
  'zeus',
  'leshrac',
  'death_prophet',
  'kunkka',
  'necrophos',
  'outworld_destroyer',
  'pangolier',
  'primal_beast',
  'templar_assassin'
]);

const SIGNATURE_ITEMS = Object.freeze({
  ember_spirit: 'item_maelstrom',
  invoker: 'item_hand_of_midas',
  lina: 'item_maelstrom',
  puck: 'item_blink',
  queen_of_pain: 'item_orchid',
  storm_spirit: 'item_orchid',
  void_spirit: 'item_orchid',
  zeus: 'item_ultimate_scepter',
  leshrac: 'item_travel_boots',
  death_prophet: 'item_black_king_bar',
  kunkka: 'item_ultimate_scepter',
  necrophos: 'item_radiance',
  outworld_destroyer: 'item_hurricane_pike',
  pangolier: 'item_diffusal_blade',
  primal_beast: 'item_blade_mail',
  templar_assassin: 'item_desolator'
});

test('mid intelligence packs remain registered within complete hero coverage', () => {
  const detailed = listHeroProfiles().filter((profile) => profile.calibrationTier === 'DETAILED');
  assert.equal(detailed.length, 127);

  for (const heroId of MID_PROFILE_IDS) {
    assert.ok(detailed.some((profile) => profile.id === heroId), `${heroId} must be detailed`);
  }
});

test('every calibrated mid hero has concrete builds and named non-generic spikes', () => {
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

test('signature items activate hero-specific calibrated mid power spikes', () => {
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

test('second mid pack exposes distinct strategic dimensions instead of one copied template', () => {
  const ta = getHeroProfile('templar_assassin');
  const dp = getHeroProfile('death_prophet');
  const pango = getHeroProfile('pangolier');
  const necro = getHeroProfile('necrophos');

  assert.ok(ta.basePower.objective > ta.basePower.survival);
  assert.ok(dp.basePower.push > dp.basePower.farm);
  assert.ok(pango.basePower.initiation > pango.basePower.farm);
  assert.ok(necro.basePower.survival > necro.basePower.mobility);
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
