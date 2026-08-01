import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GAME_EVENT_TYPES,
  GameEventPipeline,
  ROLE_ACTIONS,
  createInitialGameState,
  evaluateRoleDecision,
  getRoleObjectiveWindows
} from '../src/index.mjs';

test('objective clock exposes current power and wisdom rune windows', () => {
  const windows = getRoleObjectiveWindows(6 * 60 + 20);
  assert.equal(windows.powerRune.previousSec, 360);
  assert.equal(windows.powerRune.nextSec, 480);
  assert.equal(windows.wisdomRune.nextSec, 420);
  assert.equal(windows.wisdomRune.secondsUntil, 40);
  assert.equal(windows.wisdomRune.contestSoon, true);
});

test('mid holds bottled DD for an imminent wisdom fight', () => {
  const state = createInitialGameState({
    phase: 'playing', role: 'mid', gameTimeSec: 6 * 60 + 10,
    health: 900, maxHealth: 1000, mana: 700, maxMana: 800,
    roleContext: {
      lanePushed: true,
      wisdomFightExpected: true,
      wisdomSide: 'top',
      bottledRune: { type: 'double_damage', heldSinceSec: 360 },
      lanes: { top: { killPotential: 0.7, danger: 0.3 } }
    }
  });
  const result = evaluateRoleDecision(state);
  assert.equal(result.action, ROLE_ACTIONS.HOLD_RUNE_FOR_WISDOM);
  assert.equal(result.target, 'top');
});

test('mid rotates only after shoving and finding a valuable side lane', () => {
  const state = createInitialGameState({
    phase: 'playing', role: 'mid', gameTimeSec: 7 * 60 + 20,
    level: 8, ultimateReady: true,
    roleContext: {
      playerNetWorth: 4200,
      laneOpponentNetWorth: 3500,
      lanePushed: true,
      safeMoveAvailable: true,
      lanes: {
        bottom: { killPotential: 0.85, danger: 0.2, enemyCoreExposure: 0.8, objectiveValue: 0.4 },
        top: { killPotential: 0.2, danger: 0.5 }
      }
    }
  });
  const result = evaluateRoleDecision(state);
  assert.equal(result.action, ROLE_ACTIONS.ROTATE);
  assert.equal(result.target, 'bottom');
});

test('offlane prioritizes wisdom control before generic lane pressure', () => {
  const state = createInitialGameState({
    phase: 'playing', role: 'offlane', gameTimeSec: 6 * 60 + 25,
    roleContext: {
      wisdomControlRisk: 0.8,
      enemyCarryExposure: 0.9,
      towerPressureOpportunity: 0.9,
      lanePushed: true
    }
  });
  const result = evaluateRoleDecision(state);
  assert.equal(result.action, ROLE_ACTIONS.MOVE_TO_WISDOM);
});

test('soft support uses the stack window when no urgent lane or rune duty exists', () => {
  const state = createInitialGameState({
    phase: 'playing', role: 'soft_support', gameTimeSec: 5 * 60 + 52,
    roleContext: {
      stackCampAvailable: true,
      laneDutyUrgency: 0.2,
      midNeedsRuneHelp: false,
      lanes: { top: { killPotential: 0.1 }, bottom: { killPotential: 0.1 } }
    }
  });
  const result = evaluateRoleDecision(state);
  assert.equal(result.action, ROLE_ACTIONS.STACK_CAMP);
});

test('hard support protects a threatened carry instead of leaving for wisdom', () => {
  const state = createInitialGameState({
    phase: 'playing', role: 'hard_support', gameTimeSec: 6 * 60 + 30,
    roleContext: { carryThreat: 0.9, pullAvailable: true, lanePushed: true }
  });
  const result = evaluateRoleDecision(state);
  assert.equal(result.action, ROLE_ACTIONS.PROTECT_CARRY);
});

test('pipeline recalculates and records role decisions from role context events', () => {
  const pipeline = new GameEventPipeline();
  pipeline.dispatch({
    type: GAME_EVENT_TYPES.MATCH_STARTED,
    gameTimeSec: 0,
    payload: { hero: 'shadow_fiend', role: 'mid' }
  });
  const snapshot = pipeline.dispatch({
    type: GAME_EVENT_TYPES.ROLE_CONTEXT_UPDATED,
    gameTimeSec: 6 * 60 + 10,
    payload: {
      lanePushed: true,
      wisdomFightExpected: true,
      bottledRune: { type: 'double_damage' },
      lanes: { top: { killPotential: 0.8 } }
    }
  });
  assert.equal(snapshot.state.role, 'mid');
  assert.equal(snapshot.roleDecision.action, ROLE_ACTIONS.HOLD_RUNE_FOR_WISDOM);
  assert.ok(snapshot.roleDecisionHistory.some((entry) => entry.action === ROLE_ACTIONS.HOLD_RUNE_FOR_WISDOM));
});
