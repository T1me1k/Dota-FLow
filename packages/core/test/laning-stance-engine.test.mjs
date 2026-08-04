import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateLaningStance, presentLaningStance } from '../src/laning-stance-engine.mjs';

function state(overrides = {}) {
  return {
    phase: 'playing',
    gameTimeSec: 180,
    hero: 'morphling',
    role: 'carry',
    level: 3,
    health: 800,
    maxHealth: 1000,
    mana: 500,
    maxMana: 700,
    gold: 450,
    alive: true,
    inventory: [{ id: 'item_tango' }, { id: 'item_branches' }],
    abilities: {},
    roleContext: {},
    statusEffects: {},
    ...overrides
  };
}

test('Morphling becomes aggressive only with a confirmed lane advantage and ready Waveform', () => {
  const result = evaluateLaningStance(state({
    health: 900,
    mana: 600,
    abilities: {
      ability0: { name: 'morphling_waveform', level: 2, cooldown: 0, canCast: true, passive: false }
    },
    roleContext: {
      opponentLevel: 2,
      playerNetWorth: 1250,
      laneOpponentNetWorth: 1050,
      dangerLevel: 0.2,
      alliesNearby: 1,
      enemiesNearby: 1,
      meta: { signals: { playerNetWorth: { quality: 'LIVE' } } }
    }
  }));
  assert.equal(result.action, 'AGGRESSIVE');
  assert.equal(result.ability.name, 'Waveform');
  assert.equal(result.economy.quality, 'OBSERVED');
  assert.ok(result.confidence >= 0.8);
});

test('Sniper without confirmed enemy values receives a bounded short trade, not fake aggression', () => {
  const result = evaluateLaningStance(state({
    hero: 'sniper',
    health: 850,
    mana: 330,
    maxMana: 500,
    abilities: {
      ability0: { name: 'sniper_shrapnel', level: 2, cooldown: 0, canCast: true, passive: false }
    },
    roleContext: { dangerLevel: 0.25 }
  }));
  assert.equal(result.action, 'TRADE');
  assert.ok(result.missingSignals.includes('LANE_OPPONENT_LEVEL'));
  assert.ok(result.missingSignals.includes('LANE_OPPONENT_NET_WORTH'));
  assert.ok(result.confidence < 0.8);
});

test('Juggernaut at critical health resets even when Blade Fury is ready', () => {
  const result = evaluateLaningStance(state({
    hero: 'juggernaut',
    health: 240,
    mana: 400,
    inventory: [],
    abilities: {
      ability0: { name: 'juggernaut_blade_fury', level: 2, cooldown: 0, canCast: true, passive: false }
    }
  }));
  assert.equal(result.action, 'RESET');
  assert.deepEqual(result.missingSignals, []);
});

test('Crystal Maiden with insufficient mana switches to defensive positioning', () => {
  const result = evaluateLaningStance(state({
    hero: 'crystal_maiden',
    role: 'hard_support',
    health: 700,
    mana: 45,
    maxMana: 500,
    inventory: [],
    abilities: {
      ability0: { name: 'crystal_maiden_crystal_nova', level: 2, cooldown: 0, canCast: false, passive: false }
    }
  }));
  assert.equal(result.action, 'DEFENSIVE');
  assert.equal(result.ability.ready, false);
});

test('Lion with healthy resources and a ready spell takes a short trade', () => {
  const result = evaluateLaningStance(state({
    hero: 'lion',
    role: 'soft_support',
    level: 2,
    health: 760,
    mana: 430,
    maxMana: 600,
    abilities: {
      ability0: { name: 'lion_impale', level: 1, cooldown: 0, canCast: true, passive: false }
    },
    roleContext: {
      opponentLevel: 2,
      dangerLevel: 0.2,
      alliesNearby: 1,
      enemiesNearby: 1
    }
  }));
  assert.equal(result.action, 'TRADE');
  assert.equal(result.ability.name, 'Earth Spike');
});

test('neutral fallback remains concrete when no safe spell window is available', () => {
  const result = evaluateLaningStance(state({
    hero: 'sniper',
    health: 700,
    mana: 250,
    abilities: {
      ability0: { name: 'sniper_shrapnel', level: 1, cooldown: 8, canCast: false, passive: false }
    }
  }));
  assert.equal(result.action, 'NEUTRAL');
  const copy = presentLaningStance(result, 'ru');
  assert.match(copy.instruction, /равновесие линии/i);
});

test('every stance has complete Russian and English presentation copy', () => {
  const scenarios = [
    state({ health: 200, inventory: [] }),
    state({ hero: 'crystal_maiden', role: 'hard_support', mana: 20, maxMana: 500, inventory: [] }),
    state({ hero: 'sniper', abilities: {} }),
    state({ hero: 'sniper', abilities: { ability0: { name: 'sniper_shrapnel', level: 1, cooldown: 0, canCast: true } } }),
    state({ abilities: { ability0: { name: 'morphling_waveform', level: 2, cooldown: 0, canCast: true } }, roleContext: { opponentLevel: 2, dangerLevel: 0.1 } })
  ];
  const actions = new Set();
  for (const scenario of scenarios) {
    const result = evaluateLaningStance(scenario);
    actions.add(result.action);
    for (const language of ['ru', 'en']) {
      const copy = presentLaningStance(result, language);
      assert.ok(copy.title.length > 3);
      assert.ok(copy.instruction.length > 20);
      assert.ok(copy.cancellation.length > 15);
      assert.ok(copy.reasons.length >= 2);
    }
  }
  assert.deepEqual(actions, new Set(['RESET', 'DEFENSIVE', 'NEUTRAL', 'TRADE', 'AGGRESSIVE']));
});
