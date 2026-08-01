import {
  PLAYER_ROLES,
  createInitialGameState,
  evaluateRoleDecision
} from '../packages/core/src/index.mjs';

const scenarios = [
  {
    name: 'Mid: bottled DD before Wisdom',
    state: createInitialGameState({
      phase: 'playing', role: PLAYER_ROLES.MID, gameTimeSec: 370,
      health: 900, maxHealth: 1000, mana: 700, maxMana: 800,
      roleContext: {
        lanePushed: true,
        wisdomFightExpected: true,
        wisdomSide: 'top',
        bottledRune: { type: 'double_damage', heldSinceSec: 360 },
        lanes: { top: { killPotential: 0.75, danger: 0.25 } }
      }
    })
  },
  {
    name: 'Mid: ahead and free to rotate bottom',
    state: createInitialGameState({
      phase: 'playing', role: PLAYER_ROLES.MID, gameTimeSec: 440, ultimateReady: true,
      roleContext: {
        playerNetWorth: 4400, laneOpponentNetWorth: 3600, lanePushed: true,
        lanes: { bottom: { killPotential: 0.82, enemyCoreExposure: 0.75, danger: 0.2, objectiveValue: 0.4 } }
      }
    })
  },
  {
    name: 'Offlane: contest first Wisdom',
    state: createInitialGameState({
      phase: 'playing', role: PLAYER_ROLES.OFFLANE, gameTimeSec: 385,
      roleContext: { wisdomControlRisk: 0.8, enemyCarryExposure: 0.7, lanePushed: true }
    })
  },
  {
    name: 'Position 4: stack before next minute',
    state: createInitialGameState({
      phase: 'playing', role: PLAYER_ROLES.SOFT_SUPPORT, gameTimeSec: 352,
      roleContext: { stackCampAvailable: true, laneDutyUrgency: 0.2 }
    })
  },
  {
    name: 'Position 5: carry under threat',
    state: createInitialGameState({
      phase: 'playing', role: PLAYER_ROLES.HARD_SUPPORT, gameTimeSec: 390,
      roleContext: { carryThreat: 0.9, pullAvailable: true, lanePushed: true }
    })
  }
];

for (const scenario of scenarios) {
  const result = evaluateRoleDecision(scenario.state);
  console.log(`\n${scenario.name}`);
  console.log(`  ${result.action} · ${Math.round(result.confidence * 100)}%`);
  console.log(`  ${result.message}`);
  for (const reason of result.reasons) console.log(`  - ${reason}`);
}
