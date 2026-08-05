import test from 'node:test';
import assert from 'node:assert/strict';
import { LaneMatchupEngine, normalizeLaneState } from '../src/lane-matchup-engine.mjs';
import { createGameEventPipeline } from '../src/live-pipeline.mjs';

function morphlingState(overrides = {}) {
  return {
    source: 'gsi',
    phase: 'playing',
    matchId: 'live-lane-morphling',
    gameTimeSec: 360,
    hero: 'morphling',
    role: 'carry',
    team: 'radiant',
    level: 5,
    health: 1180,
    maxHealth: 1300,
    mana: 620,
    maxMana: 700,
    gold: 640,
    netWorth: 4100,
    alive: true,
    inventory: [{ id: 'item_power_treads' }, { id: 'item_magic_wand' }],
    abilities: {
      ability0: { name: 'morphling_waveform', level: 3, cooldown: 0, canCast: true, passive: false }
    },
    roleContext: {
      opponentLevel: 4,
      laneOpponentNetWorth: 3500,
      dangerLevel: 0.18,
      alliesNearby: 1,
      enemiesNearby: 1,
      meta: {
        signals: {
          playerNetWorth: { quality: 'LIVE', value: 4100 },
          opponentLevel: { quality: 'LIVE', value: 4 },
          laneOpponentNetWorth: { quality: 'LIVE', value: 3500 },
          dangerLevel: { quality: 'LIVE', value: 0.18 }
        }
      }
    },
    ...overrides
  };
}

test('live pipeline uses the Morphling stance engine with exact local net worth', () => {
  const snapshot = createGameEventPipeline({ initialState: morphlingState() }).snapshot();
  assert.equal(snapshot.laneDecision.stance, 'AGGRESSIVE');
  assert.equal(snapshot.laneDecision.action, 'PRESSURE_HERO');
  assert.equal(snapshot.laneDecision.laningEvidence.economy.value, 4100);
  assert.equal(snapshot.laneDecision.laningEvidence.economy.quality, 'OBSERVED');
  assert.equal(snapshot.laneDecision.laningEvidence.ability.name, 'Waveform');
  assert.equal(snapshot.laneDecision.dataQuality, 'LIVE');
  assert.match(snapshot.laneDecision.stancePresentationRu.instruction, /Waveform/i);
  assert.match(snapshot.laneDecision.stancePresentationEn.instruction, /Waveform/i);
});

test('missing opponent economy and level never become hard aggression', () => {
  const state = morphlingState({
    roleContext: { dangerLevel: 0.18, alliesNearby: 1, enemiesNearby: 1 }
  });
  const decision = new LaneMatchupEngine().evaluate(state);
  assert.equal(decision.stance, 'TRADE');
  assert.equal(decision.action, 'HOLD_LANE');
  assert.ok(decision.missingSignals.includes('LANE_OPPONENT_LEVEL'));
  assert.ok(decision.missingSignals.includes('LANE_OPPONENT_NET_WORTH'));
  assert.equal(decision.dataQuality, 'PARTIAL');
  assert.ok(decision.confidence < 0.8);
});

test('critical health produces RESET and cannot leak objective or rotation advice', () => {
  const decision = new LaneMatchupEngine().evaluate(morphlingState({
    health: 220,
    inventory: [],
    roleContext: { dangerLevel: 0.9, alliesNearby: 0, enemiesNearby: 2 }
  }));
  assert.equal(decision.stance, 'RESET');
  assert.equal(decision.action, 'RESET_LANE');
  assert.deepEqual(decision.missingSignals, []);
  assert.doesNotMatch(decision.action, /ROTATE|TOWER|OBJECTIVE|LEAVE/);
});

test('laning phase blocks the old rotation branch even when its inputs are present', () => {
  const decision = new LaneMatchupEngine().evaluate(morphlingState({
    role: 'mid',
    level: 7,
    ultimateReady: true,
    laneState: {
      lanePhase: 'LANING',
      lanePushed: true,
      lanePriority: true,
      killPotential: 0.9,
      deathRisk: 0.15,
      opponentLevel: 6,
      opponentEconomy: 3800,
      sources: {
        lanePriority: { quality: 'LIVE' },
        killPotential: { quality: 'LIVE' },
        deathRisk: { quality: 'LIVE' }
      }
    }
  }));
  assert.equal(decision.stance, 'AGGRESSIVE');
  assert.equal(decision.action, 'PRESSURE_HERO');
  assert.notEqual(decision.action, 'ROTATE');
});

test('post-lane phase preserves the existing rotation engine', () => {
  const decision = new LaneMatchupEngine().evaluate(morphlingState({
    gameTimeSec: 800,
    role: 'mid',
    level: 8,
    ultimateReady: true,
    laneState: {
      lanePhase: 'POST_LANE',
      lanePushed: true,
      lanePriority: true,
      killPotential: 0.9,
      deathRisk: 0.15,
      sources: {
        lanePriority: { quality: 'LIVE' },
        killPotential: { quality: 'LIVE' },
        deathRisk: { quality: 'LIVE' }
      }
    }
  }));
  assert.equal(decision.action, 'ROTATE');
  assert.equal(decision.dataQuality, 'LIVE');
  assert.equal(decision.stance, undefined);
});

test('normalized lane economy prefers exact net worth over contextual value and current gold', () => {
  const lane = normalizeLaneState(morphlingState({
    netWorth: 5200,
    gold: 800,
    roleContext: { playerNetWorth: 4700 }
  }));
  assert.equal(lane.ownEconomy, 5200);
});
